import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"

interface KpiCardProps {
  label: string
  value: number
  trend: number | "new"
  icon: LucideIcon
  href?: string
}

function TrendBadge({ trend }: { trend: number | "new" }) {
  if (trend === "new") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Sparkles size={12} strokeWidth={1.5} />
        Novo
      </span>
    )
  }
  if (trend === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus size={12} strokeWidth={1.5} />
        —
      </span>
    )
  }
  const pct = Math.abs(Math.round(trend * 100))
  if (trend > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-primary">
        <TrendingUp size={12} strokeWidth={1.5} />+{pct}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
      <TrendingDown size={12} strokeWidth={1.5} />
      {pct}%
    </span>
  )
}

export function KpiCard({ label, value, trend, icon: Icon, href }: KpiCardProps) {
  const formatted = new Intl.NumberFormat("pt-BR").format(value)

  const inner = (
    <div className="relative flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-border/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon
          size={20}
          className="text-muted-foreground/50"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </div>
      <p className="font-mono text-2xl font-medium tracking-tight text-foreground">
        {formatted}
      </p>
      <TrendBadge trend={trend} />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  }

  return inner
}
