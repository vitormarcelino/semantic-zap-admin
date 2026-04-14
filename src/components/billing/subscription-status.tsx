"use client"

import { cn } from "@/lib/utils"
import { useSubscription } from "@/lib/context/subscription-context"
import { UsageMeter } from "@/components/billing/usage-meter"
import { PLANS } from "@/lib/billing/plans"

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  trial_ended: "Trial encerrado",
  active: "Ativo",
  past_due: "Pagamento pendente",
  blocked: "Bloqueado",
  cancelled: "Cancelado",
  cancelled_active: "Cancelado (ativo até fim do período)",
}

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-yellow-500/15 text-yellow-400",
  trial_ended: "bg-red-500/15 text-red-400",
  active: "bg-[#00D060]/15 text-[#00D060]",
  past_due: "bg-orange-500/15 text-orange-400",
  blocked: "bg-red-500/15 text-red-400",
  cancelled: "bg-white/8 text-white/40",
  cancelled_active: "bg-white/8 text-white/40",
}

export function SubscriptionStatus() {
  const { subscription, isLoading } = useSubscription()

  if (isLoading || !subscription) {
    return (
      <div className="rounded-xl border border-white/8 bg-[#1F2535] p-6 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/8" />
      </div>
    )
  }

  const plan = PLANS[subscription.plan as keyof typeof PLANS]
  const planName = plan?.name ?? subscription.plan
  const status = subscription.status
  const statusLabel = STATUS_LABELS[status] ?? status
  const statusColor = STATUS_COLORS[status] ?? "bg-white/8 text-white/40"

  const nextBillingDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null

  const price =
    subscription.billingCycle === "yearly"
      ? (plan as { priceYearly?: number | null })?.priceYearly
      : (plan as { priceMonthly?: number | null })?.priceMonthly

  return (
    <div className="rounded-xl border border-white/8 bg-[#1F2535] p-6 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-white/38 uppercase tracking-wider font-medium">Plano atual</p>
          <p className="text-xl font-semibold text-white">{planName}</p>
          {status === "trial" && (
            <p className="text-sm text-white/50">
              {subscription.trialDaysRemaining > 0
                ? `${subscription.trialDaysRemaining} dias restantes no trial`
                : "Trial encerrando hoje"}
            </p>
          )}
          {status === "active" && nextBillingDate && price && (
            <p className="text-sm text-white/50">
              Próxima cobrança: R$ {price.toLocaleString("pt-BR")} em {nextBillingDate}
            </p>
          )}
          {(status === "cancelled_active" || status === "cancelled") && nextBillingDate && (
            <p className="text-sm text-white/50">Acesso até {nextBillingDate}</p>
          )}
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold shrink-0", statusColor)}>
          {statusLabel}
        </span>
      </div>

      <UsageMeter usage={subscription.usage} />
    </div>
  )
}
