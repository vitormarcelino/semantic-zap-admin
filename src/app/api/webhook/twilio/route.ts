import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateTwilioSignature } from "@/lib/webhook/twilio-validator"
import { parseTwilioPayload } from "@/lib/webhook/parse-twilio"
import { enqueueMessage } from "@/lib/queue/producer"

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Read raw body (application/x-www-form-urlencoded)
  const rawBody = await req.text()
  const params = Object.fromEntries(new URLSearchParams(rawBody))

  // 2. Validate Twilio signature — always return 200 on failure (prevents Twilio retries)
  if (!validateTwilioSignature(req, params)) {
    console.warn("[webhook/twilio] Invalid signature — discarding")
    return new NextResponse("", { status: 200 })
  }

  // 3. Parse form body into NormalizedMessage
  const msg = parseTwilioPayload(params)
  if (!msg) return new NextResponse("", { status: 200 })

  // 4. Find agent by receiving number
  const agent = await prisma.agent.findFirst({
    where: { phoneNumber: msg.to, provider: "twilio" },
  })
  if (!agent) {
    console.warn(`[webhook/twilio] No agent found for number ${msg.to}`)
    return new NextResponse("", { status: 200 })
  }

  // 5. Deduplicate by SmsSid
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
    console.error("[webhook/twilio] Transaction failed", err)
    return new NextResponse("", { status: 200 })
  }

  // 7. Enqueue for agent processing
  try {
    await enqueueMessage({ messageId, conversationId, agentId: agent.id })
  } catch (err) {
    console.error("[webhook/twilio] BullMQ enqueue failed", err)
  }

  // Twilio expects an empty 200 (or TwiML) — empty body is fine
  return new NextResponse("", { status: 200 })
}
