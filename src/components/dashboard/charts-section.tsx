"use client"

import dynamic from "next/dynamic"
import type { DashboardSummary } from "@/lib/dashboard/queries"
import type { Period } from "@/lib/dashboard/period"

const MessageVolumeChart = dynamic(
  () =>
    import("./message-volume-chart").then((m) => ({
      default: m.MessageVolumeChart,
    })),
  { ssr: false, loading: () => <ChartLoader height={220} /> }
)

const ConversationsPerDayChart = dynamic(
  () =>
    import("./conversations-per-day-chart").then((m) => ({
      default: m.ConversationsPerDayChart,
    })),
  { ssr: false, loading: () => <ChartLoader height={200} /> }
)

const BotVsHumanChart = dynamic(
  () =>
    import("./bot-vs-human-chart").then((m) => ({
      default: m.BotVsHumanChart,
    })),
  { ssr: false, loading: () => <ChartLoader height={220} /> }
)

function ChartLoader({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-white/5"
      style={{ height }}
    />
  )
}

interface ChartsSectionProps {
  charts: DashboardSummary["charts"]
  period: Period
}

export function ChartsSection({ charts, period }: ChartsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Line + Donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-[#1F2535] px-5 py-4 lg:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wider text-white/38">
            Volume de mensagens
          </span>
          <MessageVolumeChart data={charts.messageVolume} period={period} />
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-[#1F2535] px-5 py-4">
          <span className="text-xs font-medium uppercase tracking-wider text-white/38">
            Bot vs Humano
          </span>
          <BotVsHumanChart data={charts.botVsHuman} />
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-[#1F2535] px-5 py-4">
        <span className="text-xs font-medium uppercase tracking-wider text-white/38">
          Conversas por dia
        </span>
        <ConversationsPerDayChart
          data={charts.conversationsPerDay}
          period={period}
        />
      </div>
    </div>
  )
}
