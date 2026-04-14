import type { NextRequest } from "next/server"

export type AsaasWebhookEvent =
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_UPDATED"
  | "SUBSCRIPTION_DELETED"

export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent
  payment?: {
    id: string
    subscription?: string
    customer: string
    billingType: string
    value: number
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
  subscription?: {
    id: string
    customer: string
    status: string
    externalReference?: string
  }
}

export function validateWebhookToken(req: NextRequest): boolean {
  const token = req.headers.get("asaas-access-token")
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  if (!expected) {
    console.warn("[asaas/webhook] ASAAS_WEBHOOK_TOKEN not set — skipping validation")
    return true
  }
  return token === expected
}

export function parseWebhookEvent(body: unknown): AsaasWebhookPayload | null {
  if (typeof body !== "object" || body === null) return null
  const payload = body as AsaasWebhookPayload
  if (!payload.event) return null
  return payload
}
