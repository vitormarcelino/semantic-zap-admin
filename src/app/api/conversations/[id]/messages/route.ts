import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sendOperatorMessage } from "@/lib/conversations/send-operator-message"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId } = await params

  let body: { content?: unknown }
  try {
    body = (await req.json()) as { content?: unknown }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const content = body.content
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content must be a non-empty string" }, { status: 400 })
  }
  if (content.length > 4096) {
    return NextResponse.json({ error: "content exceeds maximum length of 4096 characters" }, { status: 400 })
  }

  try {
    const message = await sendOperatorMessage({
      conversationId,
      content: content.trim(),
      operatorId: userId,
    })
    return NextResponse.json(message)
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("not found")) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    console.error("[api/conversations/messages] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
