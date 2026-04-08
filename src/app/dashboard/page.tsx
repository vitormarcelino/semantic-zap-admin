import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Shell } from "@/components/layout/shell"
import { PeriodSelector } from "@/components/dashboard/period-selector"
import { KpiGrid } from "@/components/dashboard/kpi-grid"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { AgentGrid } from "@/components/dashboard/agent-grid"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { parsePeriod, getPeriodRange } from "@/lib/dashboard/period"
import { getDashboardSummary, getDashboardAgents } from "@/lib/dashboard/queries"
import { getDashboardCache, setDashboardCache } from "@/lib/dashboard/cache"
import type { DashboardSummary, AgentMetrics } from "@/lib/dashboard/queries"

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { period: rawPeriod } = await searchParams
  const period = parsePeriod(rawPeriod)

  const [summary, agents] = await Promise.all([
    (async () => {
      const cached = await getDashboardCache<DashboardSummary>(
        userId,
        period,
        "summary"
      )
      if (cached) return cached
      const range = getPeriodRange(period)
      const data = await getDashboardSummary(userId, period, range)
      await setDashboardCache(userId, period, "summary", data)
      return data
    })(),
    (async () => {
      const cached = await getDashboardCache<{ agents: AgentMetrics[] }>(
        userId,
        period,
        "agents"
      )
      if (cached) return cached.agents
      const { from, to } = getPeriodRange(period)
      const data = await getDashboardAgents(userId, from, to)
      await setDashboardCache(userId, period, "agents", { period, agents: data })
      return data
    })(),
  ])

  return (
    <Shell
      title="Dashboard"
      actions={
        <Suspense>
          <PeriodSelector period={period} />
        </Suspense>
      }
    >
      <div className="flex flex-col gap-8">
        {/* KPI row */}
        <KpiGrid kpis={summary.kpis} />

        {/* Charts */}
        <ChartsSection charts={summary.charts} period={period} />

        {/* Agents */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/38">
            Agentes
          </h2>
          <AgentGrid agents={agents} />
        </section>

        {/* Activity feed */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/38">
            Atividade recente
          </h2>
          <div className="rounded-xl border border-white/8 bg-[#1F2535] px-5">
            <ActivityFeed items={summary.recentActivity} />
          </div>
        </section>
      </div>
    </Shell>
  )
}

export const dynamic = "force-dynamic"
