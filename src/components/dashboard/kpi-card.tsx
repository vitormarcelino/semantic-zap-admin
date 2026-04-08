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
      <span className="flex items-center gap-1 text-xs font-medium text-white/38">
        <Sparkles size={12} strokeWidth={1.5} />
        Novo
      </span>
    )
  }
  if (trend === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-white/38">
        <Minus size={12} strokeWidth={1.5} />
        —
      </span>
    )
  }
  const pct = Math.abs(Math.round(trend * 100))
  if (trend > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-[#00D060]">
        <TrendingUp size={12} strokeWidth={1.5} />+{pct}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-[#EF4444]">
      <TrendingDown size={12} strokeWidth={1.5} />
      {pct}%
    </span>
  )
}

export function KpiCard({ label, value, trend, icon: Icon, href }: KpiCardProps) {
  const formatted = new Intl.NumberFormat("pt-BR").format(value)

  const inner = (
    <div className="relative flex flex-col gap-3 rounded-xl bg-[#1F2535] border border-white/8 px-5 py-4 transition-colors hover:border-white/[0.12]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/38 uppercase tracking-wider">
          {label}
        </span>
        <Icon
          size={20}
          className="text-white/20"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </div>
      <p className="font-mono text-2xl font-medium text-white tracking-tight">
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
