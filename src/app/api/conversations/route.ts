import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listConversations } from "@/lib/conversations/queries"
import type { ConversationMode } from "@/types/conversations"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get("agentId")

  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 })
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10)))
  const mode = searchParams.get("mode") as ConversationMode | null
  const search = searchParams.get("search") ?? undefined

  const result = await listConversations({
    agentId,
    page,
    limit,
    mode: mode ?? undefined,
    search,
  })

  return NextResponse.json(result)
}
