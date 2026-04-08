import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { listAgentsWithStats } from "@/lib/conversations/queries"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const agents = await listAgentsWithStats(userId)
  return NextResponse.json({ agents })
}
