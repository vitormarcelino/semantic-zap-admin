"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ConvPerDayPoint } from "@/lib/dashboard/queries"
import type { Period } from "@/lib/dashboard/period"

function formatDate(date: string, period: Period): string {
  if (period === "today") return date
  const [, month, day] = date.split("-")
  return `${day}/${month}`
}

interface ConversationsPerDayChartProps {
  data: ConvPerDayPoint[]
  period: Period
}

export function ConversationsPerDayChart({
  data,
  period,
}: ConversationsPerDayChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={formatted}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#1F2535",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
          }}
          labelStyle={{ color: "rgba(255,255,255,0.6)" }}
          formatter={(v) => [v, "Conversas"]}
        />
        <Bar
          dataKey="count"
          name="Conversas"
          fill="#00D060"
          fillOpacity={0.7}
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
