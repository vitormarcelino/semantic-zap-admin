"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { SubscriptionProvider } from "@/lib/context/subscription-context"
import { TrialBanner } from "@/components/billing/trial-banner"
import { GracePeriodBanner } from "@/components/billing/grace-period-banner"
import { BlockedOverlay } from "@/components/billing/blocked-overlay"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <TrialBanner />
        <GracePeriodBanner />
        <BlockedOverlay />
        {children}
      </SubscriptionProvider>
    </QueryClientProvider>
  )
}
