import { asaasFetch } from "@/lib/asaas/client"

export interface AsaasPayment {
  id: string
  subscription?: string
  customer: string
  billingType: string
  value: number
  netValue?: number
  status: string
  dueDate: string
  paymentDate?: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCode?: string
  pixCopiaECola?: string
  description?: string
  externalReference?: string
}

export interface AsaasPaymentListResponse {
  object: string
  hasMore: boolean
  totalCount: number
  limit: number
  offset: number
  data: AsaasPayment[]
}

export async function listPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  const res = await asaasFetch<AsaasPaymentListResponse>(
    `/payments?subscription=${subscriptionId}&limit=50`
  )
  return res.data
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/payments/${paymentId}`)
}
