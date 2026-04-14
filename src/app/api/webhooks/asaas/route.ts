import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateWebhookToken, parseWebhookEvent } from "@/lib/asaas/webhooks"
import { updateSubscription } from "@/lib/billing/subscription"
import { publishSSEEvent } from "@/lib/realtime/publisher"

const ok = () => new NextResponse("OK", { status: 200 })

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Validate webhook token
  if (!validateWebhookToken(req)) {
    console.warn("[webhook/asaas] Invalid token — discarding")
    return ok() // Always 200 so Asaas doesn't retry
  }

  // 2. Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    console.warn("[webhook/asaas] Malformed JSON")
    return ok()
  }

  const event = parseWebhookEvent(body)
  if (!event) {
    console.warn("[webhook/asaas] Unrecognized event shape")
    return ok()
  }

  console.log(`[webhook/asaas] Event: ${event.event}`)

  try {
    switch (event.event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        const payment = event.payment
        if (!payment) break

        // Find subscription by asaasSubscriptionId or externalReference (userId)
        const sub = payment.subscription
          ? await prisma.subscription.findUnique({ where: { asaasSubscriptionId: payment.subscription } })
          : payment.externalReference
          ? await prisma.subscription.findUnique({ where: { userId: payment.externalReference } })
          : null

        if (!sub) {
          console.warn(`[webhook/asaas] No subscription found for payment ${payment.id}`)
          break
        }

        // Calculate new period end
        const now = new Date()
        const periodEnd = new Date(now)
        if (sub.billingCycle === "yearly") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        await updateSubscription(sub.userId, {
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          pastDueAt: null,
          gracePeriodEndsAt: null,
          messagesUsedThisMonth: 0,
          usagePeriodStart: now,
        })

        // Upsert invoice
        await prisma.invoice.upsert({
          where: { asaasPaymentId: payment.id },
          create: {
            userId: sub.userId,
            asaasPaymentId: payment.id,
            asaasSubscriptionId: payment.subscription,
            amount: payment.value,
            status: "paid",
            billingType: payment.billingType,
            dueDate: new Date(payment.dueDate),
            paidAt: payment.paymentDate ? new Date(payment.paymentDate) : now,
            invoiceUrl: payment.invoiceUrl,
            description: payment.description,
          },
          update: {
            status: "paid",
            paidAt: payment.paymentDate ? new Date(payment.paymentDate) : now,
          },
        })

        await publishSSEEvent({ type: "subscription_updated", conversationId: sub.userId, payload: { status: "active" } })
        break
      }

      case "PAYMENT_OVERDUE": {
        const payment = event.payment
        if (!payment) break

        const sub = payment.subscription
          ? await prisma.subscription.findUnique({ where: { asaasSubscriptionId: payment.subscription } })
          : payment.externalReference
          ? await prisma.subscription.findUnique({ where: { userId: payment.externalReference } })
          : null

        if (!sub) break

        const now = new Date()
        const gracePeriodEndsAt = new Date(now)
        gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 5)

        await updateSubscription(sub.userId, {
          status: "past_due",
          pastDueAt: now,
          gracePeriodEndsAt,
        })

        await prisma.invoice.upsert({
          where: { asaasPaymentId: payment.id },
          create: {
            userId: sub.userId,
            asaasPaymentId: payment.id,
            asaasSubscriptionId: payment.subscription,
            amount: payment.value,
            status: "overdue",
            billingType: payment.billingType,
            dueDate: new Date(payment.dueDate),
            invoiceUrl: payment.invoiceUrl,
            description: payment.description,
          },
          update: { status: "overdue" },
        })

        // Schedule grace period check via BullMQ billing queue
        try {
          const { enqueueBillingJob } = await import("@/lib/queue/billing-producer")
          await enqueueBillingJob("check-grace-period", { userId: sub.userId }, 5 * 24 * 60 * 60 * 1000)
        } catch (err) {
          console.error("[webhook/asaas] Failed to enqueue grace period job:", err)
        }

        await publishSSEEvent({ type: "subscription_updated", conversationId: sub.userId, payload: { status: "past_due" } })
        break
      }

      case "PAYMENT_REFUNDED": {
        const payment = event.payment
        if (!payment) break
        await prisma.invoice.updateMany({
          where: { asaasPaymentId: payment.id },
          data: { status: "refunded" },
        })
        break
      }

      case "SUBSCRIPTION_DELETED": {
        const asaasSub = event.subscription
        if (!asaasSub) break

        const sub = await prisma.subscription.findUnique({
          where: { asaasSubscriptionId: asaasSub.id },
        })
        if (!sub) break

        await updateSubscription(sub.userId, {
          status: "cancelled",
          cancelledAt: new Date(),
        })

        await publishSSEEvent({ type: "subscription_updated", conversationId: sub.userId, payload: { status: "cancelled" } })
        break
      }

      default:
        console.log(`[webhook/asaas] Unhandled event: ${event.event}`)
    }
  } catch (err) {
    console.error("[webhook/asaas] Error handling event:", err)
    // Still return 200 — Asaas must not retry
  }

  return ok()
}
