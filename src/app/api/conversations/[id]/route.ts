import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getConversationWithMessages } from "@/lib/conversations/queries"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const messagesPage = Math.max(1, parseInt(searchParams.get("messagesPage") ?? "1", 10))

  const conversation = await getConversationWithMessages(id, messagesPage)
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
  }

  return NextResponse.json(conversation)
}
