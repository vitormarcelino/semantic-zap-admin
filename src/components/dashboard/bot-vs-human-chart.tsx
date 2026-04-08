"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { BotVsHuman } from "@/lib/dashboard/queries"

interface BotVsHumanChartProps {
  data: BotVsHuman
}

const COLORS = ["#00D060", "#F59E0B"]

export function BotVsHumanChart({ data }: BotVsHumanChartProps) {
  const total = data.bot + data.human
  const segments = [
    { name: "Bot", value: data.bot, pct: data.botPercent },
    { name: "Humano", value: data.human, pct: data.humanPercent },
  ]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={segments}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              isAnimationActive={false}
              strokeWidth={0}
            >
              {segments.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} fillOpacity={0.85} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1F2535",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
              }}
              formatter={(v, name, props) => [
                `${v} (${props.payload.pct}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-medium text-white">
            {new Intl.NumberFormat("pt-BR").format(total)}
          </span>
          <span className="text-xs text-white/38">mensagens</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-5">
        {segments.map((s, i) => (
          <div key={s.name} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLORS[i] }}
            />
            <span className="text-xs text-white/60">
              {s.name} — {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
