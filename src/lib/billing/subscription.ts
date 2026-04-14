import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/cache/redis"
import { trialEndsAt } from "@/lib/billing/trial"
import type { Subscription } from "@/generated/prisma-client/client"

const CACHE_TTL_SECONDS = 60
const cacheKey = (userId: string) => `billing:subscription:${userId}`

export async function getSubscription(userId: string): Promise<Subscription | null> {
  // Try Redis cache first
  const cached = await redis.get(cacheKey(userId))
  if (cached) {
    try {
      return JSON.parse(cached) as Subscription
    } catch {
      // fall through to DB
    }
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (sub) {
    await redis.set(cacheKey(userId), JSON.stringify(sub), "EX", CACHE_TTL_SECONDS)
  }
  return sub
}

export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  await redis.del(cacheKey(userId))
}

/**
 * Ensures a Subscription row exists for the user.
 * Called alongside ensureUser() when a user first interacts with the system.
 * Safe to call multiple times (upsert — no-op if already exists).
 */
export async function ensureSubscription(userId: string): Promise<Subscription> {
  const now = new Date()
  const trialEnd = trialEndsAt(now)

  const sub = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: "trial",
      status: "trial",
      trialStartedAt: now,
      trialEndsAt: trialEnd,
      usagePeriodStart: now,
    },
    update: {}, // Never overwrite existing subscription
  })

  await redis.set(cacheKey(userId), JSON.stringify(sub), "EX", CACHE_TTL_SECONDS)
  return sub
}

export async function updateSubscription(
  userId: string,
  data: Partial<Subscription>
): Promise<Subscription> {
  const sub = await prisma.subscription.update({
    where: { userId },
    data,
  })
  await redis.set(cacheKey(userId), JSON.stringify(sub), "EX", CACHE_TTL_SECONDS)
  return sub
}
