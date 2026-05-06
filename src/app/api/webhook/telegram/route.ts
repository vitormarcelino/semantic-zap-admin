import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateTelegramSignature } from "@/lib/webhook/telegram-validator"
import { parseTelegramPayload } from "@/lib/webhook/parse-telegram"
import { enqueueMessage } from "@/lib/queue/producer"
import { publishSSEEvent } from "@/lib/realtime/publisher"
import { isWithinLimit } from "@/lib/billing/limits"

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Validate secret token — always return 200 on failure (prevents Telegram retries)
  const secret = req.headers.get("x-telegram-bot-api-secret-token")
  if (!validateTelegramSignature(secret)) {
    console.warn("[webhook/telegram] Invalid secret token — discarding")
    return new NextResponse("", { status: 200 })
  }

  // 2. Parse JSON body
  let update: Parameters<typeof parseTelegramPayload>[0]
  try {
    update = await req.json()
  } catch {
    console.warn("[webhook/telegram] Malformed JSON body")
    return new NextResponse("", { status: 200 })
  }

  // 3. Normalize payload (returns null for non-text updates)
  const msg = parseTelegramPayload(update)
  if (!msg) return new NextResponse("", { status: 200 })

  // 4. Find agent by bot username and provider
  const agent = await prisma.agent.findFirst({
    where: { phoneNumber: msg.to, provider: "telegram" },
  })
  if (!agent) {
    console.warn(`[webhook/telegram] No agent found for bot username ${msg.to}`)
    return new NextResponse("", { status: 200 })
  }

  // 4b. Check active conversation limit for the agent owner
  const withinLimit = await isWithinLimit(agent.userId, "conversations").catch(() => true)
  if (!withinLimit) {
    console.log(`[webhook/telegram] Active conversation limit reached for user ${agent.userId} — discarding`)
    return new NextResponse("", { status: 200 })
  }

  // 5. Deduplicate by update_id (stored in wamid)
  const existing = await prisma.message.findUnique({ where: { wamid: msg.messageId } })
  if (existing) return new NextResponse("", { status: 200 })

  // 6. Persist conversation + message
  let messageId: string
  let conversationId: string
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
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") {
      return new NextResponse("", { status: 200 })
    }
    console.error("[webhook/telegram] Transaction failed", err)
    return new NextResponse("", { status: 200 })
  }

  // 7. Mode check — if human mode, skip enqueue and notify dashboard instead
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { mode: true },
  })

  if (conversation?.mode === "human") {
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
    return new NextResponse("", { status: 200 })
  }

  // 8. Enqueue for agent processing
  try {
    await enqueueMessage({ messageId, conversationId, agentId: agent.id })
  } catch (err) {
    console.error("[webhook/telegram] BullMQ enqueue failed", err)
  }

  return new NextResponse("", { status: 200 })
}
