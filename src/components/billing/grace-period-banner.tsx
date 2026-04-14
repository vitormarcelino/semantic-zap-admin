"use client"

import { useMemo } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useSubscription } from "@/lib/context/subscription-context"

export function GracePeriodBanner() {
  const { isPastDue, subscription } = useSubscription()

  const { daysLeft, dateStr } = useMemo(() => {
    if (!subscription?.gracePeriodEndsAt) return { daysLeft: 0, dateStr: "" }
    const endsAt = new Date(subscription.gracePeriodEndsAt)
    const now = new Date()
    const dl = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const ds = endsAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    return { daysLeft: dl, dateStr: ds }
  }, [subscription])

  if (!isPastDue || !subscription?.gracePeriodEndsAt) return null

  return (
    <div className="flex items-center justify-between gap-4 bg-orange-500/15 px-5 py-2.5 text-sm font-medium text-orange-300">
      <span className="flex items-center gap-2">
        <AlertTriangle size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        Pagamento não processado. Regularize até {dateStr} para evitar bloqueio.{" "}
        {daysLeft > 0 && `(${daysLeft} ${daysLeft === 1 ? "dia restante" : "dias restantes"})`}
      </span>
      <Link
        href="/billing"
        className="shrink-0 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20 transition-colors"
      >
        Resolver
      </Link>
    </div>
  )
}
