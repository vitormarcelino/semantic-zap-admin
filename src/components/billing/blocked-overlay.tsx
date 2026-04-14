"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldOff } from "lucide-react"
import { useSubscription } from "@/lib/context/subscription-context"

export function BlockedOverlay() {
  const { isBlocked, subscription } = useSubscription()
  const pathname = usePathname()

  // Never show overlay on the billing page
  if (!isBlocked || pathname.startsWith("/billing")) return null

  const status = subscription?.status ?? "blocked"
  const isTrialEnded = status === "trial_ended"

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F1117]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-white/8 bg-[#1F2535] p-10 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15">
          <ShieldOff size={28} className="text-red-400" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-white">
            Seu acesso foi suspenso
          </h2>
          <p className="text-sm text-white/50">
            {isTrialEnded
              ? "Seu trial de 30 dias encerrou. Escolha um plano para continuar usando o SemanticZap."
              : "Não foi possível processar seu pagamento. Regularize para retomar o acesso."}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/billing"
            className="rounded-lg bg-[#00D060] px-5 py-2.5 text-sm font-semibold text-[#081a0e] hover:bg-[#00D060]/90 transition-colors"
          >
            Ver planos
          </Link>
          <a
            href="mailto:suporte@semanticzap.com"
            className="rounded-lg border border-white/8 px-5 py-2.5 text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
          >
            Falar com suporte
          </a>
        </div>
      </div>
    </div>
  )
}
