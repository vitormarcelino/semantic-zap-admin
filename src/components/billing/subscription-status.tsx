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
  trial: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  trial_ended: "bg-destructive/15 text-destructive",
  active: "bg-accent text-accent-foreground",
  past_due: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  blocked: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  cancelled_active: "bg-muted text-muted-foreground",
}

export function SubscriptionStatus() {
  const { subscription, isLoading } = useSubscription()

  if (isLoading || !subscription) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-card p-6">
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
    )
  }

  const plan = PLANS[subscription.plan as keyof typeof PLANS]
  const planName = plan?.name ?? subscription.plan
  const status = subscription.status
  const statusLabel = STATUS_LABELS[status] ?? status
  const statusColor = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"

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
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plano atual</p>
          <p className="text-xl font-semibold text-foreground">{planName}</p>
          {status === "trial" && (
            <p className="text-sm text-muted-foreground">
              {subscription.trialDaysRemaining > 0
                ? `${subscription.trialDaysRemaining} dias restantes no trial`
                : "Trial encerrando hoje"}
            </p>
          )}
          {status === "active" && nextBillingDate && price && (
            <p className="text-sm text-muted-foreground">
              Próxima cobrança: R$ {price.toLocaleString("pt-BR")} em {nextBillingDate}
            </p>
          )}
          {(status === "cancelled_active" || status === "cancelled") && nextBillingDate && (
            <p className="text-sm text-muted-foreground">Acesso até {nextBillingDate}</p>
          )}
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", statusColor)}>
          {statusLabel}
        </span>
      </div>

      <UsageMeter usage={subscription.usage} />
    </div>
  )
}
