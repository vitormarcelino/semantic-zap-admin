"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AgentMetrics } from "@/lib/dashboard/queries"

interface AgentCardProps {
  agent: AgentMetrics
}

function formatResponseTime(seconds: number | null): string {
  if (seconds === null) return "—"
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function AgentDashboardCard({ agent }: AgentCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "mt-0.5 h-2 w-2 shrink-0 rounded-full",
              agent.isActive ? "bg-primary" : "bg-muted-foreground/20"
            )}
          />
          <span className="truncate text-sm font-medium text-foreground">
            {agent.name}
          </span>
        </div>
        <Link
          href={`/conversations?agentId=${agent.id}`}
          className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver
          <ArrowRight size={12} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Model / tone */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
          {agent.model}
        </span>
        <span>{agent.tone}</span>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        {[
          { label: "Conversas", value: agent.metrics.conversations },
          { label: "Mensagens", value: agent.metrics.messages },
          { label: "Transferências", value: agent.metrics.takeovers },
        ].map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5">
            <span className="font-mono text-base font-medium text-foreground">
              {new Intl.NumberFormat("pt-BR").format(m.value)}
            </span>
            <span className="text-xs text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Resp. média:{" "}
          <span className="font-mono text-foreground/60">
            {formatResponseTime(agent.metrics.avgResponseTimeSeconds)}
          </span>
        </span>
        {agent.phoneNumber && (
          <span className="truncate font-mono">{agent.phoneNumber}</span>
        )}
      </div>

      {/* Attention badge */}
      {agent.metrics.attentionCount > 0 && (
        <Link
          href={`/conversations?agentId=${agent.id}&mode=human`}
          className="flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/15 dark:text-amber-400"
        >
          <AlertTriangle size={12} strokeWidth={1.5} />
          {agent.metrics.attentionCount}{" "}
          {agent.metrics.attentionCount === 1
            ? "conversa aguardando atenção"
            : "conversas aguardando atenção"}
        </Link>
      )}
    </div>
  )
}
