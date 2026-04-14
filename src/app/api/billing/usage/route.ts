import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getSubscription } from "@/lib/billing/subscription"
import { getPlanLimits } from "@/lib/billing/plans"
import { prisma } from "@/lib/prisma"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getSubscription(userId)
  if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 })

  const limits = getPlanLimits(sub.plan)

  const [agentCount, activeConversationCount] = await Promise.all([
    prisma.agent.count({ where: { userId } }),
    prisma.conversation.count({ where: { status: "active", agent: { userId } } }),
  ])

  return NextResponse.json({
    usage: {
      agents: { used: agentCount, limit: limits.agents },
      messagesThisMonth: { used: sub.messagesUsedThisMonth, limit: limits.messagesPerMonth },
      activeConversations: { used: activeConversationCount, limit: limits.activeConversations },
    },
  })
}
