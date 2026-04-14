export const PLANS = {
  trial: {
    id: "trial",
    name: "Trial",
    priceMonthly: null,
    priceYearly: null,
    asaasMonthlyPlanId: null,
    asaasYearlyPlanId: null,
    limits: {
      agents: 1,
      messagesPerMonth: 100,
      activeConversations: 10,
    },
    durationDays: 30,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 97,
    priceYearly: 970,
    asaasMonthlyPlanId: "starter_monthly",
    asaasYearlyPlanId: "starter_yearly",
    limits: {
      agents: 3,
      messagesPerMonth: 1000,
      activeConversations: 50,
    },
    durationDays: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 197,
    priceYearly: 1970,
    asaasMonthlyPlanId: "pro_monthly",
    asaasYearlyPlanId: "pro_yearly",
    limits: {
      agents: 10,
      messagesPerMonth: 5000,
      activeConversations: 200,
    },
    durationDays: null,
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 397,
    priceYearly: 3970,
    asaasMonthlyPlanId: "business_monthly",
    asaasYearlyPlanId: "business_yearly",
    limits: {
      agents: -1,           // -1 = unlimited
      messagesPerMonth: -1,
      activeConversations: -1,
    },
    durationDays: null,
  },
} as const

export type PlanId = keyof typeof PLANS
export type PaidPlanId = Exclude<PlanId, "trial">

export interface PlanLimits {
  agents: number
  messagesPerMonth: number
  activeConversations: number
}

export function getPlanById(planId: string): (typeof PLANS)[PlanId] | null {
  if (planId in PLANS) return PLANS[planId as PlanId]
  return null
}

export function getPlanLimits(planId: string): PlanLimits {
  const plan = getPlanById(planId)
  if (!plan) return PLANS.trial.limits
  return plan.limits
}

export function isUnlimited(limit: number): boolean {
  return limit === -1
}

export function getPaidPlans() {
  return [PLANS.starter, PLANS.pro, PLANS.business] as const
}
