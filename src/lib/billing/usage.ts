import { prisma } from "@/lib/prisma"
import { invalidateSubscriptionCache } from "@/lib/billing/subscription"

export async function incrementMessageUsage(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: { messagesUsedThisMonth: { increment: 1 } },
  })
  await invalidateSubscriptionCache(userId)
}

export async function resetMonthlyUsage(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: {
      messagesUsedThisMonth: 0,
      usagePeriodStart: new Date(),
    },
  })
  await invalidateSubscriptionCache(userId)
}
