"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { Shell } from "@/components/layout/shell"
import { SubscriptionStatus } from "@/components/billing/subscription-status"
import { PlansGrid } from "@/components/billing/plans-grid"
import { CheckoutForm } from "@/components/billing/checkout-form"
import { InvoiceList } from "@/components/billing/invoice-list"
import { useSubscription } from "@/lib/context/subscription-context"

interface PendingPayment {
  bankSlipUrl?: string
  pixQrCode?: string
  pixCopiaECola?: string
}

export default function BillingPage() {
  const { refetch } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; cycle: "monthly" | "yearly" } | null>(null)
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null)
  const [copied, setCopied] = useState(false)

  function handleSelectPlan(planId: string, cycle: "monthly" | "yearly") {
    setSelectedPlan({ id: planId, cycle })
    setPendingPayment(null)
  }

  function handleCheckoutSuccess(invoice?: PendingPayment) {
    setSelectedPlan(null)
    if (invoice?.bankSlipUrl || invoice?.pixQrCode) {
      setPendingPayment(invoice)
    }
    refetch()
  }

  async function handleCopyPix() {
    if (!pendingPayment?.pixCopiaECola) return
    await navigator.clipboard.writeText(pendingPayment.pixCopiaECola)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Shell title="Assinatura e Cobrança">
      <div className="mx-auto max-w-4xl flex flex-col gap-10">

        {/* Section 1: Current subscription */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/38">
            Plano atual
          </h2>
          <SubscriptionStatus />
        </section>

        {/* PIX / Boleto payment result */}
        {pendingPayment && (
          <section className="rounded-xl border border-[#00D060]/20 bg-[#00D060]/5 p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-white">Pagamento gerado</h3>
            {pendingPayment.pixQrCode && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-white/50">
                  Escaneie o QR Code abaixo ou copie o código PIX para pagar.
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pendingPayment.pixQrCode)}`}
                  alt="QR Code PIX"
                  className="rounded-lg"
                  width={180}
                  height={180}
                />
                {pendingPayment.pixCopiaECola && (
                  <button
                    onClick={handleCopyPix}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors w-fit"
                  >
                    {copied ? <Check size={14} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> : <Copy size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />}
                    {copied ? "Copiado!" : "Copiar código PIX"}
                  </button>
                )}
              </div>
            )}
            {pendingPayment.bankSlipUrl && (
              <a
                href={pendingPayment.bankSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#00D060] px-4 py-2.5 text-sm font-semibold text-[#081a0e] hover:bg-[#00D060]/90 transition-colors w-fit"
              >
                <ExternalLink size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                Abrir boleto
              </a>
            )}
          </section>
        )}

        {/* Section 2: Plan comparison */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/38">
            Planos disponíveis
          </h2>
          <PlansGrid onSelectPlan={handleSelectPlan} />
        </section>

        {/* Section 3: Checkout form (shown when plan is selected) */}
        {selectedPlan && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-white/38">
              Dados de pagamento
            </h2>
            <div className="rounded-xl border border-white/8 bg-[#1F2535] p-6">
              <CheckoutForm
                planId={selectedPlan.id}
                billingCycle={selectedPlan.cycle}
                onSuccess={handleCheckoutSuccess}
                onCancel={() => setSelectedPlan(null)}
              />
            </div>
          </section>
        )}

        {/* Section 4: Invoice history */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-white/38">
            Histórico de faturas
          </h2>
          <InvoiceList />
        </section>
      </div>
    </Shell>
  )
}
