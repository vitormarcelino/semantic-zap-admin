import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateWhatsAppSignature } from "@/lib/webhook/whatsapp-validator"
import { parseWhatsAppPayload } from "@/lib/webhook/parse-whatsapp"
import { handleStatusUpdate, type MetaStatusUpdate } from "@/lib/webhook/handle-status-update"
import { enqueueMessage } from "@/lib/queue/producer"
import { publishSSEEvent } from "@/lib/realtime/publisher"

// Minimal typings for status entries in the Meta payload
interface MetaValue {
  messages?: unknown[]
  statuses?: MetaStatusUpdate[]
  metadata?: { display_phone_number: string; phone_number_id: string }
}

interface MetaPayloadRaw {
  object?: string
  entry?: Array<{ changes?: Array<{ value?: MetaValue }> }>
}

// GET — Meta hub verification
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// POST — inbound message + status update handler
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Read raw body first (must happen before JSON.parse for HMAC)
  const rawBody = await req.text()

  // 2. Validate signature — always return 200 on failure (prevents Meta retries)
  const signature = req.headers.get("x-hub-signature-256")
  if (!validateWhatsAppSignature(rawBody, signature)) {
    console.warn("[webhook/whatsapp] Invalid signature — discarding")
    return new NextResponse("OK", { status: 200 })
  }

  // 3. Parse JSON
  let payload: MetaPayloadRaw
  try {
    payload = JSON.parse(rawBody) as MetaPayloadRaw
  } catch {
    console.warn("[webhook/whatsapp] Malformed JSON body")
    return new NextResponse("OK", { status: 200 })
  }

  const value = payload.entry?.[0]?.changes?.[0]?.value

  // 4. Handle status updates (delivery/read receipts) — separate from messages
  if (value?.statuses && value.statuses.length > 0) {
    for (const status of value.statuses) {
      await handleStatusUpdate(status).catch((err) => {
        console.error("[webhook/whatsapp] Status update failed:", err)
      })
    }
    return new NextResponse("OK", { status: 200 })
  }

  // 5. Extract normalized message (returns null for non-text types)
  const msg = parseWhatsAppPayload(payload as Parameters<typeof parseWhatsAppPayload>[0])
  if (!msg) return new NextResponse("OK", { status: 200 })

  // 6. Find agent by receiving number
  const agent = await prisma.agent.findFirst({
    where: { phoneNumber: msg.to, provider: "whatsapp" },
  })
  if (!agent) {
    console.warn(`[webhook/whatsapp] No agent found for number ${msg.to}`)
    return new NextResponse("OK", { status: 200 })
  }

  // 7. Deduplicate — check if this wamid was already processed
  const existing = await prisma.message.findUnique({ where: { wamid: msg.messageId } })
  if (existing) return new NextResponse("OK", { status: 200 })

  // 8. Persist conversation + message
  let messageId: string
  let conversationId: string
  let conversationMode: string
  try {
    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.upsert({
        where: { agentId_phoneNumber: { agentId: agent.id, phoneNumber: msg.from } },
        create: {
          agentId: agent.id,
          phoneNumber: msg.from,
          lastMessageAt: msg.timestamp,
        },
        update: { lastMessageAt: msg.timestamp },
      })

      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: msg.body,
          status: "pending",
          wamid: msg.messageId,
        },
      })

      return { conversation, message }
    })

    messageId = result.message.id
    conversationId = result.conversation.id
    conversationMode = result.conversation.mode
  } catch (err: unknown) {
    // P2002 = unique constraint violation — duplicate wamid from a race condition
    if ((err as { code?: string }).code === "P2002") {
      return new NextResponse("OK", { status: 200 })
    }
    console.error("[webhook/whatsapp] Transaction failed", err)
    return new NextResponse("OK", { status: 200 })
  }

  // 9. Mode check — if human mode, skip enqueue and notify dashboard instead
  if (conversationMode === "human") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: { increment: 1 } },
    })
    await publishSSEEvent({
      type: "new_message",
      conversationId,
      payload: {
        message: {
          id: messageId,
          role: "user",
          content: msg.body,
          status: "pending",
          sentBy: null,
          deliveredAt: null,
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      },
    })
    return new NextResponse("OK", { status: 200 })
  }

  // 10. Enqueue for agent processing
  try {
    await enqueueMessage({ messageId, conversationId, agentId: agent.id })
  } catch (err) {
    console.error("[webhook/whatsapp] BullMQ enqueue failed", err)
    // Message is in DB with status "pending" — a recovery job can re-enqueue
  }

  return new NextResponse("OK", { status: 200 })
}
