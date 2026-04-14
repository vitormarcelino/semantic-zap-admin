"use client"

import { useEffect, useState, useCallback } from "react"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Invoice {
  id: string
  amount: number
  status: string
  billingType: string
  dueDate: string
  paidAt: string | null
  invoiceUrl: string | null
  bankSlipUrl: string | null
  description: string | null
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  paid: "bg-[#00D060]/15 text-[#00D060]",
  overdue: "bg-red-500/15 text-red-400",
  cancelled: "bg-white/8 text-white/40",
  refunded: "bg-white/8 text-white/40",
}

const BILLING_TYPE_LABEL: Record<string, string> = {
  CREDIT_CARD: "Cartão",
  BOLETO: "Boleto",
  PIX: "PIX",
}

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchInvoices = useCallback(async (p: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/billing/invoices?page=${p}`)
      if (res.ok) {
        const data = (await res.json()) as { invoices: Invoice[]; pagination: { totalPages: number } }
        setInvoices(data.invoices)
        setTotalPages(data.pagination.totalPages)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices(page)
  }, [fetchInvoices, page])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-white/30">
        Nenhuma fatura encontrada.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-white/8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/38">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/38">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/38">
                Método
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/38">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/38">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-white/38">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-white/50">
                  {new Date(inv.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-white/70">{inv.description ?? "—"}</td>
                <td className="px-4 py-3 text-white/50">
                  {BILLING_TYPE_LABEL[inv.billingType] ?? inv.billingType}
                </td>
                <td className="px-4 py-3 text-right font-mono text-white">
                  R$ {inv.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      STATUS_COLOR[inv.status] ?? "bg-white/8 text-white/40"
                    )}
                  >
                    {STATUS_LABEL[inv.status] ?? inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {(inv.invoiceUrl || inv.bankSlipUrl) && (
                    <a
                      href={inv.invoiceUrl ?? inv.bankSlipUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      Ver
                      <ExternalLink size={11} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-white/8 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-white/38">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-white/8 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 disabled:opacity-30 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
