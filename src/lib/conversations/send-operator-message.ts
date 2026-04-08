import { prisma } from "@/lib/prisma"
import { sendMessage } from "@/lib/sender"
import { splitMessage } from "@/lib/sender/split-message"
import { publishSSEEvent } from "@/lib/realtime/publisher"

export interface SendOperatorMessageOptions {
  conversationId: string
  content: string
  operatorId: string
}

export interface SendOperatorMessageResult {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  status: string
  sentBy: string
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
}

export async function sendOperatorMessage(
  opts: SendOperatorMessageOptions
): Promise<SendOperatorMessageResult> {
  const { conversationId, content, operatorId } = opts

  // Fetch conversation with agent provider info
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      agent: {
        select: {
          provider: true,
          phoneNumber: true,
        },
      },
    },
  })

  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`)
  }

  // Switch to human mode and reset unread count
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      mode: "human",
      unreadCount: 0,
      lastMessageAt: new Date(),
    },
  })

  // Send via provider
  const parts = splitMessage(content)
  let messageSendStatus: string = "sent"

  try {
    await sendMessage({
      provider: conversation.agent.provider,
      to: conversation.phoneNumber,
      from: conversation.agent.phoneNumber ?? "",
      parts,
    })
  } catch (err) {
    console.error(`[send-operator-message] Send failed for conversation ${conversationId}:`, err)
    messageSendStatus = "failed"
  }

  // Save message to DB regardless of send success
  const sentBy = `operator:${operatorId}`
  const savedMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content,
      status: messageSendStatus,
      sentBy,
    },
    select: {
      id: true,
      conversationId: true,
      role: true,
      content: true,
      status: true,
      sentBy: true,
      deliveredAt: true,
      readAt: true,
      createdAt: true,
    },
  })

  const result: SendOperatorMessageResult = {
    id: savedMessage.id,
    conversationId: savedMessage.conversationId,
    role: "assistant",
    content: savedMessage.content,
    status: savedMessage.status,
    sentBy: savedMessage.sentBy ?? sentBy,
    deliveredAt: savedMessage.deliveredAt?.toISOString() ?? null,
    readAt: savedMessage.readAt?.toISOString() ?? null,
    createdAt: savedMessage.createdAt.toISOString(),
  }

  // Emit SSE events
  await publishSSEEvent({
    type: "new_message",
    conversationId,
    payload: { message: result },
  })

  await publishSSEEvent({
    type: "mode_changed",
    conversationId,
    payload: { mode: "human" },
  })

  return result
}
