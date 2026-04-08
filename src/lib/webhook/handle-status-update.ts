import { prisma } from "@/lib/prisma"
import { publishSSEEvent } from "@/lib/realtime/publisher"

export interface MetaStatusUpdate {
  id: string       // wamid
  status: string   // "delivered" | "read" | "failed" | "sent"
  timestamp: string
  recipient_id?: string
}

export async function handleStatusUpdate(status: MetaStatusUpdate): Promise<void> {
  const { id: wamid, status: statusValue } = status

  // Find message by wamid
  const message = await prisma.message.findUnique({
    where: { wamid },
    select: { id: true, conversationId: true, deliveredAt: true, readAt: true },
  })

  if (!message) {
    console.warn(`[webhook/status] Unknown wamid ${wamid} — skipping`)
    return
  }

  const updateData: {
    deliveredAt?: Date
    readAt?: Date
    status?: string
  } = {}

  let sseStatus = statusValue

  if (statusValue === "delivered") {
    if (!message.deliveredAt) {
      updateData.deliveredAt = new Date()
    }
    sseStatus = "delivered"
  } else if (statusValue === "read") {
    // When "read" arrives, set both deliveredAt (if missing) and readAt
    // Meta does not always send "delivered" before "read"
    updateData.readAt = new Date()
    if (!message.deliveredAt) {
      updateData.deliveredAt = new Date()
    }
    sseStatus = "read"
  } else if (statusValue === "failed") {
    updateData.status = "failed"
    sseStatus = "failed"
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.message.update({
      where: { id: message.id },
      data: updateData,
    })
  }

  await publishSSEEvent({
    type: "message_status",
    conversationId: message.conversationId,
    payload: {
      messageId: message.id,
      status: sseStatus,
      deliveredAt: updateData.deliveredAt?.toISOString() ?? null,
      readAt: updateData.readAt?.toISOString() ?? null,
    },
  })
}
