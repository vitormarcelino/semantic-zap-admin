"use client"

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react"

export interface SubscriptionUsage {
  agents: { used: number; limit: number }
  messagesThisMonth: { used: number; limit: number }
  activeConversations: { used: number; limit: number }
}

export interface SubscriptionData {
  plan: string
  status: string
  billingCycle: string | null
  trialEndsAt: string | null
  trialDaysRemaining: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  gracePeriodEndsAt: string | null
  limits: {
    agents: number
    messagesPerMonth: number
    activeConversations: number
  }
  usage: SubscriptionUsage
}

interface SubscriptionContextValue {
  subscription: SubscriptionData | null
  isLoading: boolean
  isTrialing: boolean
  isBlocked: boolean
  isPastDue: boolean
  trialDaysRemaining: number
  canCreate: (resource: "agents" | "conversations") => boolean
  refetch: () => void
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/subscription")
      if (res.ok) {
        const data = (await res.json()) as SubscriptionData
        setSubscription(data)
      }
    } catch {
      // Non-fatal — UI still renders, billing info just unavailable
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  // Listen to SSE subscription_updated events
  useEffect(() => {
    const source = new EventSource("/api/sse")
    source.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as { type: string }
        if (event.type === "subscription_updated") {
          fetch_()
        }
      } catch {
        // ignore parse errors
      }
    }
    return () => source.close()
  }, [fetch_])

  const status = subscription?.status ?? "trial"
  const isTrialing = status === "trial"
  const isBlocked = status === "blocked" || status === "trial_ended"
  const isPastDue = status === "past_due"
  const trialDaysRemaining = subscription?.trialDaysRemaining ?? 0

  const canCreate = useCallback(
    (resource: "agents" | "conversations"): boolean => {
      if (!subscription) return true
      const { limits, usage } = subscription
      if (resource === "agents") {
        return limits.agents === -1 || usage.agents.used < limits.agents
      }
      return limits.activeConversations === -1 || usage.activeConversations.used < limits.activeConversations
    },
    [subscription]
  )

  return (
    <SubscriptionContext.Provider
      value={{ subscription, isLoading, isTrialing, isBlocked, isPastDue, trialDaysRemaining, canCreate, refetch: fetch_ }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider")
  return ctx
}
