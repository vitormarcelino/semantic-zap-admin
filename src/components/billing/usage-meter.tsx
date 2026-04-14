"use client"

import { cn } from "@/lib/utils"
import type { SubscriptionUsage } from "@/lib/context/subscription-context"

function MeterBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const isUnlimited = limit === -1
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const isNearLimit = !isUnlimited && pct >= 80
  const isAtLimit = !isUnlimited && pct >= 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50">{label}</span>
        <span className="font-mono text-xs text-white/70">
          {used.toLocaleString("pt-BR")}
          {isUnlimited ? "" : ` / ${limit.toLocaleString("pt-BR")}`}
          {isUnlimited && <span className="text-[#00D060] ml-1">ilimitado</span>}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 w-full rounded-full bg-white/8">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              isAtLimit ? "bg-red-500" : isNearLimit ? "bg-orange-400" : "bg-[#00D060]"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function UsageMeter({ usage }: { usage: SubscriptionUsage }) {
  return (
    <div className="flex flex-col gap-4">
      <MeterBar used={usage.agents.used} limit={usage.agents.limit} label="Agentes" />
      <MeterBar
        used={usage.messagesThisMonth.used}
        limit={usage.messagesThisMonth.limit}
        label="Mensagens este mês"
      />
      <MeterBar
        used={usage.activeConversations.used}
        limit={usage.activeConversations.limit}
        label="Conversas ativas"
      />
    </div>
  )
}
