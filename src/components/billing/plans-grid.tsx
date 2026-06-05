"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { PlanCard } from "@/components/billing/plan-card"
import { getPaidPlans } from "@/lib/billing/plans"
import { useSubscription } from "@/lib/context/subscription-context"

interface PlansGridProps {
  onSelectPlan: (planId: string, billingCycle: "monthly" | "yearly") => void
  isLoading?: boolean
}

export function PlansGrid({ onSelectPlan, isLoading }: PlansGridProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const { subscription } = useSubscription()
  const currentPlanId = subscription?.plan ?? "trial"
  const plans = getPaidPlans()

  return (
    <div className="flex flex-col gap-6">
      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          {(["monthly", "yearly"] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                billingCycle === cycle
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cycle === "monthly" ? "Mensal" : "Anual"}
              {cycle === "yearly" && (
                <span className="ml-1.5 text-[10px] font-semibold text-primary">-17%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            id={plan.id}
            name={plan.name}
            priceMonthly={plan.priceMonthly}
            priceYearly={plan.priceYearly}
            billingCycle={billingCycle}
            currentPlanId={currentPlanId}
            onSelect={(planId) => onSelectPlan(planId, billingCycle)}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  )
}
