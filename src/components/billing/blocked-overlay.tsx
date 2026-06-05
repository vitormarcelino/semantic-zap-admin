"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ShieldOff } from "lucide-react"
import { useSubscription } from "@/lib/context/subscription-context"

export function BlockedOverlay() {
  const { isBlocked, subscription } = useSubscription()
  const pathname = usePathname()

  if (!isBlocked || pathname.startsWith("/billing")) return null

  const status = subscription?.status ?? "blocked"
  const isTrialEnded = status === "trial_ended"

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15">
          <ShieldOff size={28} className="text-destructive" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">
            Seu acesso foi suspenso
          </h2>
          <p className="text-sm text-muted-foreground">
            {isTrialEnded
              ? "Seu trial de 30 dias encerrou. Escolha um plano para continuar usando o SemanticZap."
              : "Não foi possível processar seu pagamento. Regularize para retomar o acesso."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/billing"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver planos
          </Link>
          <a
            href="mailto:suporte@semanticzap.com"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Falar com suporte
          </a>
        </div>
      </div>
    </div>
  )
}
