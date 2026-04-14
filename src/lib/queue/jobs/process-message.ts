import { prisma } from "@/lib/prisma"
import { getAgentConfig, setAgentConfig, type AgentConfig } from "@/lib/cache/agent-config"
import { sendMessage } from "@/lib/sender"
import { splitMessage } from "@/lib/sender/split-message"
import { publishSSEEvent } from "@/lib/realtime/publisher"
import { assertWithinLimits, LimitExceededError } from "@/lib/billing/limits"
import { incrementMessageUsage } from "@/lib/billing/usage"
import type { EnqueuePayload } from "@/lib/webhook/types"

const PYTHON_TIMEOUT_MS = 55_000

export async function processMessageJob(data: EnqueuePayload): Promise<void> {
  const { messageId, conversationId, agentId } = data

  // 1. Fetch message with full context
  const record = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              language: true,
              tone: true,
              model: true,
              temperature: true,
              maxTokens: true,
              systemPrompt: true,
              greetingPrompt: true,
              fallbackPrompt: true,
              provider: true,
              phoneNumber: true,
            },
          },
        },
      },
    },
  })

  if (!record) {
    console.warn(`[worker] message ${messageId} not found — skipping`)
    return
  }

  // 2. Mode check — operator has taken over; discard job silently (no retry)
  // Using $queryRaw because the Prisma client types are regenerated after migration
  const modeRows = await prisma.$queryRaw<Array<{ mode: string }>>`
    SELECT mode FROM "Conversation" WHERE id = ${conversationId}
  `
  if (modeRows[0]?.mode === "human") {
    console.log(`[worker] job discarded: conversation ${conversationId} is in human mode`)
    return
  }

  // 3. Idempotency guard — already successfully processed
  if (record.status === "sent") {
    console.warn(`[worker] message ${messageId} already sent — skipping`)
    return
  }

  // 4. Mark as processing
  await prisma.message.update({
    where: { id: messageId },
    data: { status: "processing" },
  })

  try {
    // 4. Fetch agent config (cache → internal API fallback)
    let config = await getAgentConfig(agentId)
    if (!config) {
      const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3000"
      const secret = process.env.INTERNAL_API_SECRET ?? ""
      const res = await fetch(`${baseUrl}/api/internal/agents/${agentId}`, {
        headers: { "x-internal-secret": secret },
      })
      if (!res.ok) {
        if (res.status === 404) {
          // Agent was deleted — do not retry
          await prisma.message.update({ where: { id: messageId }, data: { status: "failed" } })
          console.warn(`[worker] agent ${agentId} not found — marking message as failed`)
          return
        }
        throw new Error(`Failed to fetch agent config: ${res.status}`)
      }
      config = (await res.json()) as AgentConfig
      await setAgentConfig(config)
    }

    // 5. Check message limit before calling Python
    const agentUserId = record.conversation.agent
      ? await prisma.agent.findUnique({ where: { id: agentId }, select: { userId: true } }).then((a) => a?.userId)
      : undefined

    if (agentUserId) {
      try {
        await assertWithinLimits(agentUserId, "messages")
      } catch (err) {
        if (err instanceof LimitExceededError) {
          console.log(`[worker] Message limit reached for user ${agentUserId} — marking as failed`)
          await prisma.message.update({ where: { id: messageId }, data: { status: "failed" } })
          return
        }
        throw err
      }
      await incrementMessageUsage(agentUserId)
    }

    // 6. Call Python service
    const pythonUrl = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000"
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS)

    let reply: string
    try {
      const pythonRes = await fetch(`${pythonUrl}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.INTERNAL_API_SECRET ?? ""}`,
        },
        body: JSON.stringify({
          messageId,
          conversationId,
          agentId,
          userMessage: record.content,
          phoneNumber: record.conversation.phoneNumber,
          provider: record.conversation.agent.provider,
          config,
        }),
        signal: controller.signal,
      })

      if (!pythonRes.ok) {
        const body = await pythonRes.text()
        throw new Error(`Python service error (${pythonRes.status}): ${body}`)
      }

      const json = (await pythonRes.json()) as { reply?: string }
      reply = json.reply?.trim() || ""
    } finally {
      clearTimeout(timeout)
    }

    // 7. Fallback for empty reply
    if (!reply) {
      reply =
        config.fallbackPrompt?.trim() ||
        "Sorry, I couldn't process your request at this time."
      console.warn(`[worker] Python returned empty reply for message ${messageId} — using fallback`)
    }

    // 8. Re-check mode before sending — operator may have taken over during the Python call
    const freshModeRows = await prisma.$queryRaw<Array<{ mode: string }>>`
      SELECT mode FROM "Conversation" WHERE id = ${conversationId}
    `
    if (freshModeRows[0]?.mode === "human") {
      console.log(`[worker] discarding reply: conversation ${conversationId} switched to human mode during LLM call`)
      await prisma.message.update({ where: { id: messageId }, data: { status: "sent" } })
      return
    }

    // 8. Split into chunks
    const parts = splitMessage(reply)

    // 9. Send via the appropriate provider
    await sendMessage({
      provider: record.conversation.agent.provider,
      to: record.conversation.phoneNumber,
      from: record.conversation.agent.phoneNumber ?? "",
      parts,
    })

    // 10. Persist assistant message + update statuses
    const [assistantMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: reply,
          status: "sent",
          sentBy: "bot",
        },
      }),
      prisma.message.update({
        where: { id: messageId },
        data: { status: "sent" },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ])

    // 11. Emit SSE event so the dashboard updates in real time
    await publishSSEEvent({
      type: "new_message",
      conversationId,
      payload: {
        message: {
          id: assistantMessage.id,
          role: "assistant",
          content: reply,
          status: "sent",
          sentBy: "bot",
          deliveredAt: null,
          readAt: null,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
      },
    })

  } catch (err) {
    // Reset to "pending" so the next BullMQ retry attempt can re-run the full flow
    await prisma.message
      .update({ where: { id: messageId }, data: { status: "pending" } })
      .catch(() => {}) // ignore DB errors during error handling
    throw err
  }
}
