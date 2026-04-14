import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { getSubscription, updateSubscription, invalidateSubscriptionCache } from "@/lib/billing/subscription"
import { getPlanById, getPlanLimits } from "@/lib/billing/plans"
import { getTrialDaysRemaining } from "@/lib/billing/trial"
import { createCustomer } from "@/lib/asaas/customers"
import { createSubscription as createAsaasSubscription } from "@/lib/asaas/subscriptions"
import { listPayments } from "@/lib/asaas/payments"
import { AsaasError } from "@/lib/asaas/client"
import { prisma } from "@/lib/prisma"
import type { AsaasBillingType, AsaasCycle } from "@/lib/asaas/subscriptions"

// GET /api/billing/subscription — current subscription + usage
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getSubscription(userId)
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 })

  const limits = getPlanLimits(sub.plan)
  const trialDaysRemaining = sub.status === "trial" ? getTrialDaysRemaining(sub) : 0

  const [agentCount, activeConversationCount] = await Promise.all([
    prisma.agent.count({ where: { userId } }),
    prisma.conversation.count({ where: { status: "active", agent: { userId } } }),
  ])

  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    billingCycle: sub.billingCycle,
    trialEndsAt: sub.trialEndsAt,
    trialDaysRemaining,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    gracePeriodEndsAt: sub.gracePeriodEndsAt,
    limits,
    usage: {
      agents: { used: agentCount, limit: limits.agents },
      messagesThisMonth: { used: sub.messagesUsedThisMonth, limit: limits.messagesPerMonth },
      activeConversations: { used: activeConversationCount, limit: limits.activeConversations },
    },
  })
}

// POST /api/billing/subscription — create or upgrade subscription
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: {
    planId: string
    billingCycle: "monthly" | "yearly"
    billingType: AsaasBillingType
    cpfCnpj?: string
    creditCard?: {
      holderName: string
      number: string
      expiryMonth: string
      expiryYear: string
      ccv: string
    }
    holderInfo?: {
      name: string
      email: string
      cpfCnpj: string
      postalCode: string
      addressNumber: string
    }
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { planId, billingCycle, billingType, creditCard, holderInfo } = body
  if (!planId || !billingCycle || !billingType) {
    return NextResponse.json({ error: "planId, billingCycle, and billingType are required" }, { status: 400 })
  }

  const plan = getPlanById(planId)
  if (!plan || planId === "trial") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly
  if (!price) return NextResponse.json({ error: "Plan has no price" }, { status: 400 })

  // Get or create Asaas customer
  const sub = await getSubscription(userId)
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 })

  let asaasCustomerId = sub.asaasCustomerId

  if (!asaasCustomerId) {
    // Fetch user details from Clerk
    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Usuário"
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ""

    try {
      const customer = await createCustomer({
        name,
        email,
        cpfCnpj: holderInfo?.cpfCnpj ?? body.cpfCnpj,
      })
      asaasCustomerId = customer.id
    } catch (err) {
      if (err instanceof AsaasError) {
        return NextResponse.json({ error: "Falha ao criar cliente no Asaas", detail: err.body }, { status: 502 })
      }
      throw err
    }
  }

  // Determine next due date (today for credit card, tomorrow for boleto/PIX)
  const nextDueDate = new Date()
  if (billingType !== "CREDIT_CARD") nextDueDate.setDate(nextDueDate.getDate() + 1)
  const dueDateStr = nextDueDate.toISOString().split("T")[0]

  const cycle: AsaasCycle = billingCycle === "yearly" ? "YEARLY" : "MONTHLY"
  const description = `SemanticZap ${plan.name} - ${billingCycle === "yearly" ? "Anual" : "Mensal"}`

  try {
    const asaasSub = await createAsaasSubscription({
      customer: asaasCustomerId,
      billingType,
      cycle,
      value: price,
      nextDueDate: dueDateStr,
      description,
      externalReference: userId,
      ...(billingType === "CREDIT_CARD" && creditCard && holderInfo
        ? { creditCard, creditCardHolderInfo: holderInfo }
        : {}),
    })

    // Update subscription in DB
    const now = new Date()
    const periodEnd = new Date(now)
    if (billingCycle === "yearly") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    await updateSubscription(userId, {
      plan: planId,
      status: billingType === "CREDIT_CARD" ? "active" : "trial", // will flip to active on PAYMENT_CONFIRMED webhook
      billingCycle,
      asaasCustomerId,
      asaasSubscriptionId: asaasSub.id,
      currentPeriodStart: billingType === "CREDIT_CARD" ? now : null,
      currentPeriodEnd: billingType === "CREDIT_CARD" ? periodEnd : null,
    })

    // Fetch first invoice if boleto/PIX for QR code / bank slip URL
    let firstInvoice = null
    if (billingType !== "CREDIT_CARD") {
      try {
        const payments = await listPayments(asaasSub.id)
        firstInvoice = payments[0] ?? null
        if (firstInvoice) {
          await prisma.invoice.upsert({
            where: { asaasPaymentId: firstInvoice.id },
            create: {
              userId,
              asaasPaymentId: firstInvoice.id,
              asaasSubscriptionId: asaasSub.id,
              amount: firstInvoice.value,
              status: "pending",
              billingType,
              dueDate: new Date(firstInvoice.dueDate),
              invoiceUrl: firstInvoice.invoiceUrl,
              bankSlipUrl: firstInvoice.bankSlipUrl,
              pixQrCode: firstInvoice.pixQrCode,
              pixCopiaECola: firstInvoice.pixCopiaECola,
              description,
            },
            update: {},
          })
        }
      } catch {
        // Non-fatal — invoice will be upserted when webhook fires
      }
    }

    return NextResponse.json({
      subscription: { plan: planId, status: billingType === "CREDIT_CARD" ? "active" : "pending_payment" },
      ...(firstInvoice
        ? {
            invoice: {
              bankSlipUrl: firstInvoice.bankSlipUrl,
              pixQrCode: firstInvoice.pixQrCode,
              pixCopiaECola: firstInvoice.pixCopiaECola,
              invoiceUrl: firstInvoice.invoiceUrl,
            },
          }
        : {}),
    })
  } catch (err) {
    if (err instanceof AsaasError) {
      return NextResponse.json({ error: "Falha ao criar assinatura no Asaas", detail: err.body }, { status: 502 })
    }
    throw err
  }
}

// DELETE /api/billing/subscription — cancel at period end
export async function DELETE(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getSubscription(userId)
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  if (!sub.asaasSubscriptionId) {
    return NextResponse.json({ error: "No active paid subscription" }, { status: 400 })
  }

  const { cancelSubscription } = await import("@/lib/asaas/subscriptions")
  await cancelSubscription(sub.asaasSubscriptionId)

  await updateSubscription(userId, {
    cancelAtPeriodEnd: true,
    cancelledAt: new Date(),
    status: "cancelled_active",
  })

  await invalidateSubscriptionCache(userId)

  return NextResponse.json({ ok: true })
}
