import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { parsePeriod, getPeriodRange } from "@/lib/dashboard/period"
import { getDashboardAgents } from "@/lib/dashboard/queries"
import { getDashboardCache, setDashboardCache } from "@/lib/dashboard/cache"
import type { AgentMetrics } from "@/lib/dashboard/queries"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const period = parsePeriod(new URL(req.url).searchParams.get("period"))

  const cached = await getDashboardCache<{ period: string; agents: AgentMetrics[] }>(
    userId,
    period,
    "agents"
  )
  if (cached) return NextResponse.json(cached)

  const { from, to } = getPeriodRange(period)
  const agents = await getDashboardAgents(userId, from, to)

  const result = { period, agents }
  await setDashboardCache(userId, period, "agents", result)

  return NextResponse.json(result)
}
