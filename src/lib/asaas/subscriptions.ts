import { asaasFetch } from "@/lib/asaas/client"

export type AsaasBillingType = "CREDIT_CARD" | "BOLETO" | "PIX"
export type AsaasCycle = "MONTHLY" | "YEARLY"

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

export interface AsaasCreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  addressComplement?: string
  phone?: string
  mobilePhone?: string
}

export interface AsaasSubscriptionInput {
  customer: string              // Asaas customer ID
  billingType: AsaasBillingType
  cycle: AsaasCycle
  value: number
  nextDueDate: string           // "YYYY-MM-DD"
  description: string
  externalReference?: string    // our userId
  creditCard?: AsaasCreditCard
  creditCardHolderInfo?: AsaasCreditCardHolderInfo
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: AsaasBillingType
  cycle: AsaasCycle
  value: number
  status: string
  nextDueDate: string
  description: string
  externalReference?: string
}

export async function createSubscription(
  data: AsaasSubscriptionInput
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getSubscriptionFromAsaas(
  subscriptionId: string
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" })
}

export async function updateSubscriptionInAsaas(
  subscriptionId: string,
  data: Partial<Pick<AsaasSubscriptionInput, "value" | "description" | "billingType" | "cycle">>
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
