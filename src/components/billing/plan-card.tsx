"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "3 agentes",
    "1.000 mensagens/mês",
    "50 conversas ativas",
    "WhatsApp & SMS",
    "Suporte por e-mail",
  ],
  pro: [
    "10 agentes",
    "5.000 mensagens/mês",
    "200 conversas ativas",
    "WhatsApp & SMS",
    "Dashboard avançado",
    "Suporte prioritário",
  ],
  business: [
    "Agentes ilimitados",
    "Mensagens ilimitadas",
    "Conversas ilimitadas",
    "WhatsApp & SMS",
    "Dashboard avançado",
    "Suporte dedicado",
    "SLA garantido",
  ],
}

interface PlanCardProps {
  id: string
  name: string
  priceMonthly: number | null
  priceYearly: number | null
  billingCycle: "monthly" | "yearly"
  currentPlanId: string
  onSelect: (planId: string) => void
  isLoading?: boolean
}

export function PlanCard({
  id,
  name,
  priceMonthly,
  priceYearly,
  billingCycle,
  currentPlanId,
  onSelect,
  isLoading,
}: PlanCardProps) {
  const isCurrent = id === currentPlanId
  const isUpgrade =
    !isCurrent &&
    ["starter", "pro", "business"].indexOf(id) >
      ["starter", "pro", "business"].indexOf(currentPlanId)
  const isDowngrade = !isCurrent && !isUpgrade
  const isPro = id === "pro"

  const price = billingCycle === "yearly" ? priceYearly : priceMonthly
  const monthlyEquivalent =
    billingCycle === "yearly" && priceYearly ? Math.round(priceYearly / 12) : null

  const features = PLAN_FEATURES[id] ?? []

  return (
    <div
      className={cn(
        "relative flex flex-col gap-6 rounded-xl border p-6 transition-colors",
        isPro
          ? "border-[#00D060]/40 bg-[#00D060]/5"
          : "border-white/8 bg-[#1F2535]",
        isCurrent && "ring-2 ring-[#00D060]/30"
      )}
    >
      {isPro && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#00D060] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#081a0e]">
          Popular
        </span>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-white">{name}</p>
        {price !== null ? (
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold text-white">
              R$ {price.toLocaleString("pt-BR")}
            </span>
            <span className="mb-1 text-xs text-white/40">
              /{billingCycle === "yearly" ? "ano" : "mês"}
            </span>
          </div>
        ) : (
          <p className="text-3xl font-bold text-white/30">—</p>
        )}
        {monthlyEquivalent && (
          <p className="text-xs text-white/40">
            equivale a R$ {monthlyEquivalent}/mês
          </p>
        )}
        {billingCycle === "yearly" && (
          <span className="inline-block w-fit rounded-full bg-[#00D060]/15 px-2 py-0.5 text-[10px] font-semibold text-[#00D060]">
            2 meses grátis
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/70">
            <Check size={14} className="mt-0.5 shrink-0 text-[#00D060]" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(id)}
        disabled={isCurrent || isLoading}
        className={cn(
          "mt-auto rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
          isCurrent
            ? "cursor-default bg-white/5 text-white/30"
            : isUpgrade
            ? "bg-[#00D060] text-[#081a0e] hover:bg-[#00D060]/90"
            : isDowngrade
            ? "border border-white/12 bg-transparent text-white/60 hover:bg-white/5"
            : "bg-[#00D060] text-[#081a0e] hover:bg-[#00D060]/90"
        )}
      >
        {isCurrent
          ? "Plano atual"
          : isUpgrade
          ? "Fazer upgrade"
          : "Fazer downgrade"}
      </button>
    </div>
  )
}
