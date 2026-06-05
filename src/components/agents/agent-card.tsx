import { Bot, Pause, ArrowRight } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

type AgentStatus = "online" | "offline" | "error" | "warning"

interface AgentCardProps {
  name: string
  phone: string
  status: AgentStatus
  messagesCount: number
  conversationsCount: number
  avgResponse: string
  className?: string
}

interface StatItemProps {
  value: string | number
  label: string
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-base font-medium text-foreground">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export function AgentCard({
  name,
  phone,
  status,
  messagesCount,
  conversationsCount,
  avgResponse,
  className,
}: AgentCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Bot
              size={18}
              className="text-accent-foreground"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="font-mono text-xs text-muted-foreground">{phone}</p>
          </div>
        </div>
        <StatusBadge status={status} className="shrink-0" />
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border" />

      {/* Stats row */}
      <div className="flex items-center gap-6 px-5 py-4">
        <StatItem value={messagesCount} label="Mensagens" />
        <div className="h-8 w-px bg-border" />
        <StatItem value={conversationsCount} label="Conversas" />
        <div className="h-8 w-px bg-border" />
        <StatItem value={avgResponse} label="Resp. média" />
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border" />

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
        >
          <ArrowRight
            size={14}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          Detalhes
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground"
        >
          <Pause
            size={14}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          Pausar
        </button>
      </div>
    </div>
  )
}
