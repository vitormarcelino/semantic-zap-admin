import type { Subscription } from "@/generated/prisma-client/client"

export function getTrialDaysRemaining(sub: Subscription): number {
  const now = new Date()
  const endsAt = new Date(sub.trialEndsAt)
  const diffMs = endsAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function isTrialExpired(sub: Subscription): boolean {
  return new Date() > new Date(sub.trialEndsAt)
}

export function trialEndsAt(startedAt: Date): Date {
  const d = new Date(startedAt)
  d.setDate(d.getDate() + 30)
  return d
}
