import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  value: string | number
  label: string
  delta?: string
  deltaType?: "up" | "down"
  icon?: LucideIcon
  className?: string
}

function ArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M6 2.5V9.5M6 9.5L2.5 6M6 9.5L9.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MetricCard({
  value,
  label,
  delta,
  deltaType,
  icon: Icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <Icon
            size={20}
            className="text-muted-foreground/40"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </div>

      <p className="font-mono text-2xl font-medium tracking-tight text-foreground">
        {value}
      </p>

      {delta && deltaType && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            deltaType === "up" ? "text-primary" : "text-destructive"
          )}
        >
          {deltaType === "up" ? <ArrowUp /> : <ArrowDown />}
          <span>{delta}</span>
        </div>
      )}
    </div>
  )
}
