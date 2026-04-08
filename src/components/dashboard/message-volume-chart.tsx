"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { ChartDataPoint } from "@/lib/dashboard/queries"
import type { Period } from "@/lib/dashboard/period"

function formatDate(date: string, period: Period): string {
  if (period === "today") return date // already "0h", "1h", etc.
  const [, month, day] = date.split("-")
  return `${day}/${month}`
}

interface MessageVolumeChartProps {
  data: ChartDataPoint[]
  period: Period
}

export function MessageVolumeChart({ data, period }: MessageVolumeChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}
        />
        <Line
          type="monotone"
          dataKey="incoming"
          name="Recebidas"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="outgoing"
          name="Enviadas"
          stroke="#00D060"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
