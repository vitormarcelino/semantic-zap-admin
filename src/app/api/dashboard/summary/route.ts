import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { parsePeriod, getPeriodRange } from "@/lib/dashboard/period"
import { getDashboardSummary } from "@/lib/dashboard/queries"
import { getDashboardCache, setDashboardCache } from "@/lib/dashboard/cache"
import type { DashboardSummary } from "@/lib/dashboard/queries"

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const period = parsePeriod(new URL(req.url).searchParams.get("period"))

  const cached = await getDashboardCache<DashboardSummary>(
    userId,
    period,
    "summary"
  )
  if (cached) return NextResponse.json(cached)

  const range = getPeriodRange(period)
  const summary = await getDashboardSummary(userId, period, range)

  await setDashboardCache(userId, period, "summary", summary)

  return NextResponse.json(summary)
}
