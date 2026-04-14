"use client"

import Link from "next/link"
import { Zap } from "lucide-react"
import { useSubscription } from "@/lib/context/subscription-context"
import { cn } from "@/lib/utils"

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining } = useSubscription()

  if (!isTrialing) return null

  const urgency =
    trialDaysRemaining <= 3 ? "red" : trialDaysRemaining <= 7 ? "orange" : "yellow"

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 text-sm font-medium",
        urgency === "yellow" && "bg-yellow-500/15 text-yellow-300",
        urgency === "orange" && "bg-orange-500/15 text-orange-300",
        urgency === "red" && "bg-red-500/15 text-red-300"
      )}
    >
      <span className="flex items-center gap-2">
        <Zap size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {trialDaysRemaining > 0
          ? `Seu trial termina em ${trialDaysRemaining} ${trialDaysRemaining === 1 ? "dia" : "dias"}.`
          : "Seu trial encerrou hoje."}
      </span>
      <Link
        href="/billing"
        className="shrink-0 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20 transition-colors"
      >
        Escolher um plano
      </Link>
    </div>
  )
}
