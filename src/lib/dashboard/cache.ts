import { redis } from "@/lib/cache/redis"
import type { Period } from "./period"

const TTL_TODAY = 60 // 1 minute
const TTL_LONG = 300 // 5 minutes

function ttl(period: Period): number {
  return period === "today" ? TTL_TODAY : TTL_LONG
}

export async function getDashboardCache<T>(
  userId: string,
  period: Period,
  key: string
): Promise<T | null> {
  const raw = await redis.get(`dashboard:${key}:${userId}:${period}`)
  if (!raw) return null
  return JSON.parse(raw) as T
}

export async function setDashboardCache<T>(
  userId: string,
  period: Period,
  key: string,
  data: T
): Promise<void> {
  await redis.setex(
    `dashboard:${key}:${userId}:${period}`,
    ttl(period),
    JSON.stringify(data)
  )
}

export async function invalidateDashboardCache(userId: string): Promise<void> {
  const keys = await redis.keys(`dashboard:*:${userId}:*`)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}
