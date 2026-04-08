import { MessageSquare, Activity, Bot, UserCheck } from "lucide-react"
import { KpiCard } from "./kpi-card"
import type { DashboardSummary } from "@/lib/dashboard/queries"

interface KpiGridProps {
  kpis: DashboardSummary["kpis"]
}

export function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Total de conversas"
        value={kpis.totalConversations}
        trend={kpis.trends.totalConversations}
        icon={MessageSquare}
      />
      <KpiCard
        label="Conversas ativas"
        value={kpis.activeConversations}
        trend={kpis.trends.activeConversations}
        icon={Activity}
      />
      <KpiCard
        label="Atendidas pelo bot"
        value={kpis.botHandled}
        trend={kpis.trends.botHandled}
        icon={Bot}
      />
      <KpiCard
        label="Transferências humanas"
        value={kpis.humanTakeovers}
        trend={kpis.trends.humanTakeovers}
        icon={UserCheck}
      />
    </div>
  )
}
