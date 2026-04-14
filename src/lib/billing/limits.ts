import { prisma } from "@/lib/prisma"
import { getSubscription } from "@/lib/billing/subscription"
import { getPlanLimits, isUnlimited } from "@/lib/billing/plans"

export class LimitExceededError extends Error {
  constructor(
    public readonly resource: string,
    public readonly used: number,
    public readonly limit: number,
    public readonly plan: string
  ) {
    super(`Plan limit reached: ${used}/${limit} ${resource} on ${plan} plan`)
    this.name = "LimitExceededError"
  }
}

type Resource = "agents" | "messages" | "conversations"

/**
 * Throws LimitExceededError if the user has reached their plan limit for the given resource.
 * Returns silently if within limits.
 *
 * For agents and conversations, counts live from DB.
 * For messages, reads the monthly counter from the subscription row.
 */
export async function assertWithinLimits(userId: string, resource: Resource): Promise<void> {
  const sub = await getSubscription(userId)
  if (!sub) return // No subscription row = trial not yet started — allow

  const limits = getPlanLimits(sub.plan)

  if (resource === "agents") {
    const limit = limits.agents
    if (isUnlimited(limit)) return
    const count = await prisma.agent.count({ where: { userId } })
    if (count >= limit) throw new LimitExceededError("agents", count, limit, sub.plan)
  }

  if (resource === "messages") {
    const limit = limits.messagesPerMonth
    if (isUnlimited(limit)) return
    const used = sub.messagesUsedThisMonth
    if (used >= limit) throw new LimitExceededError("messages", used, limit, sub.plan)
  }

  if (resource === "conversations") {
    const limit = limits.activeConversations
    if (isUnlimited(limit)) return
    // Get count of active conversations for all agents owned by this user
    const count = await prisma.conversation.count({
      where: {
        status: "active",
        agent: { userId },
      },
    })
    if (count >= limit) throw new LimitExceededError("conversations", count, limit, sub.plan)
  }
}

/**
 * Returns true if user is within limit, false if exceeded.
 * Non-throwing version for use in webhook handlers where we silently discard.
 */
export async function isWithinLimit(userId: string, resource: Resource): Promise<boolean> {
  try {
    await assertWithinLimits(userId, resource)
    return true
  } catch (err) {
    if (err instanceof LimitExceededError) return false
    throw err
  }
}
