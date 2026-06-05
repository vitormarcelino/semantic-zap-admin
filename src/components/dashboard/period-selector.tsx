"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Period } from "@/lib/dashboard/period"

const OPTIONS: { label: string; value: Period }[] = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
]

interface PeriodSelectorProps {
  period: Period
}

export function PeriodSelector({ period }: PeriodSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function select(value: Period) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => select(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            period === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
