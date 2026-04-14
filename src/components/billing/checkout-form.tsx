"use client"

import { useState } from "react"
import { CreditCard, FileText, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

type BillingType = "CREDIT_CARD" | "BOLETO" | "PIX"

interface CheckoutFormProps {
  planId: string
  billingCycle: "monthly" | "yearly"
  onSuccess: (invoice?: { bankSlipUrl?: string; pixQrCode?: string; pixCopiaECola?: string }) => void
  onCancel: () => void
}

interface FormState {
  billingType: BillingType
  holderName: string
  cardNumber: string
  expiryMonth: string
  expiryYear: string
  ccv: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
}

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function CheckoutForm({ planId, billingCycle, onSuccess, onCancel }: CheckoutFormProps) {
  const [form, setForm] = useState<FormState>({
    billingType: "CREDIT_CARD",
    holderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
    cpfCnpj: "",
    postalCode: "",
    addressNumber: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const rawCard = form.cardNumber.replace(/\s/g, "")
    const cpfRaw = form.cpfCnpj.replace(/\D/g, "")

    const body: Record<string, unknown> = {
      planId,
      billingCycle,
      billingType: form.billingType,
      cpfCnpj: cpfRaw || undefined,
    }

    if (form.billingType === "CREDIT_CARD") {
      body.creditCard = {
        holderName: form.holderName,
        number: rawCard,
        expiryMonth: form.expiryMonth,
        expiryYear: form.expiryYear,
        ccv: form.ccv,
      }
      body.holderInfo = {
        name: form.holderName,
        cpfCnpj: cpfRaw,
        postalCode: form.postalCode.replace(/\D/g, ""),
        addressNumber: form.addressNumber,
      }
    }

    try {
      const res = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string; invoice?: { bankSlipUrl?: string; pixQrCode?: string; pixCopiaECola?: string } }
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar pagamento")
        return
      }
      onSuccess(data.invoice)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const PAYMENT_TABS: { id: BillingType; label: string; icon: React.ReactNode }[] = [
    { id: "CREDIT_CARD", label: "Cartão", icon: <CreditCard size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /> },
    { id: "BOLETO", label: "Boleto", icon: <FileText size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /> },
    { id: "PIX", label: "PIX", icon: <QrCode size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /> },
  ]

  const inputClass =
    "w-full rounded-lg border border-white/8 bg-[#181C26] px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-[#00D060]/50 focus:ring-1 focus:ring-[#00D060]/30 transition-colors"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Payment method tabs */}
      <div className="flex gap-0.5 rounded-lg border border-white/8 bg-[#181C26] p-0.5">
        {PAYMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => set("billingType", tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors",
              form.billingType === tab.id
                ? "bg-[#1F2535] text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* CPF field (always required for Asaas) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/50">CPF</label>
        <input
          type="text"
          required
          placeholder="000.000.000-00"
          value={form.cpfCnpj}
          onChange={(e) => set("cpfCnpj", formatCpf(e.target.value))}
          className={inputClass}
        />
      </div>

      {/* Credit card fields */}
      {form.billingType === "CREDIT_CARD" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Nome no cartão</label>
            <input
              type="text"
              required
              placeholder="JOAO SILVA"
              value={form.holderName}
              onChange={(e) => set("holderName", e.target.value.toUpperCase())}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50">Número do cartão</label>
            <input
              type="text"
              required
              placeholder="0000 0000 0000 0000"
              value={form.cardNumber}
              onChange={(e) => set("cardNumber", formatCardNumber(e.target.value))}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Mês</label>
              <input
                type="text"
                required
                placeholder="MM"
                maxLength={2}
                value={form.expiryMonth}
                onChange={(e) => set("expiryMonth", e.target.value.replace(/\D/g, ""))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Ano</label>
              <input
                type="text"
                required
                placeholder="AAAA"
                maxLength={4}
                value={form.expiryYear}
                onChange={(e) => set("expiryYear", e.target.value.replace(/\D/g, ""))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">CVV</label>
              <input
                type="text"
                required
                placeholder="123"
                maxLength={4}
                value={form.ccv}
                onChange={(e) => set("ccv", e.target.value.replace(/\D/g, ""))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">CEP</label>
              <input
                type="text"
                required
                placeholder="00000-000"
                maxLength={9}
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/50">Número</label>
              <input
                type="text"
                required
                placeholder="100"
                value={form.addressNumber}
                onChange={(e) => set("addressNumber", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </>
      )}

      {/* Boleto / PIX info */}
      {form.billingType !== "CREDIT_CARD" && (
        <p className="rounded-lg border border-white/8 bg-[#181C26] px-4 py-3 text-sm text-white/50">
          {form.billingType === "BOLETO"
            ? "Um boleto será gerado após confirmar. Pague até a data de vencimento para ativar sua assinatura."
            : "Um QR Code PIX será gerado após confirmar. O pagamento é aprovado em instantes."}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-white/8 px-4 py-2.5 text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-lg bg-[#00D060] px-4 py-2.5 text-sm font-semibold text-[#081a0e] hover:bg-[#00D060]/90 transition-colors disabled:opacity-60"
        >
          {isLoading ? "Processando..." : "Confirmar assinatura"}
        </button>
      </div>
    </form>
  )
}
