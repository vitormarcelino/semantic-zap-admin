import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { publishSSEEvent } from "@/lib/realtime/publisher"
import type { ConversationMode } from "@/types/conversations"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId } = await params

  let body: { mode?: unknown }
  try {
    body = (await req.json()) as { mode?: unknown }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const mode = body.mode
  if (mode !== "bot" && mode !== "human") {
    return NextResponse.json({ error: 'mode must be "bot" or "human"' }, { status: 400 })
  }

  const existing = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      mode,
      // Reset unread count when handing back to bot
      ...(mode === "bot" ? { unreadCount: 0 } : {}),
    },
    select: {
      id: true,
      agentId: true,
      phoneNumber: true,
      mode: true,
      assignedTo: true,
      unreadCount: true,
      lastMessageAt: true,
    },
  })

  await publishSSEEvent({
    type: "mode_changed",
    conversationId,
    payload: { mode: mode as ConversationMode },
  })

  return NextResponse.json({
    ...updated,
    mode: updated.mode as ConversationMode,
    lastMessageAt: updated.lastMessageAt.toISOString(),
  })
}
