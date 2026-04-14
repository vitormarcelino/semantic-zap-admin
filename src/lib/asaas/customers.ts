import { asaasFetch } from "@/lib/asaas/client"

export interface AsaasCustomerInput {
  name: string
  email: string
  cpfCnpj?: string
  mobilePhone?: string
}

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  cpfCnpj?: string
  mobilePhone?: string
}

export async function createCustomer(data: AsaasCustomerInput): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getCustomer(customerId: string): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/customers/${customerId}`)
}
