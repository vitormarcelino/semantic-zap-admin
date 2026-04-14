import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/cache/redis"

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-internal-secret")
  return secret === process.env.INTERNAL_API_SECRET
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // 1. Reset monthly message usage for all active/trial subscriptions
  const resetResult = await prisma.subscription.updateMany({
    where: {
      status: { in: ["active", "trial", "cancelled_active", "past_due"] },
    },
    data: {
      messagesUsedThisMonth: 0,
      usagePeriodStart: now,
    },
  })

  // 2. Expire trials that have ended
  const expiredTrials = await prisma.subscription.findMany({
    where: { status: "trial", trialEndsAt: { lt: now } },
    select: { userId: true },
  })

  if (expiredTrials.length > 0) {
    await prisma.subscription.updateMany({
      where: { userId: { in: expiredTrials.map((s) => s.userId) } },
      data: { status: "trial_ended" },
    })
    // Invalidate cache for expired trial users
    const pipeline = redis.pipeline()
    for (const { userId } of expiredTrials) {
      pipeline.del(`billing:subscription:${userId}`)
    }
    await pipeline.exec()
  }

  // 3. Block subscriptions past grace period
  const expiredGrace = await prisma.subscription.findMany({
    where: { status: "past_due", gracePeriodEndsAt: { lt: now } },
    select: { userId: true },
  })

  if (expiredGrace.length > 0) {
    await prisma.subscription.updateMany({
      where: { userId: { in: expiredGrace.map((s) => s.userId) } },
      data: { status: "blocked" },
    })
    const pipeline = redis.pipeline()
    for (const { userId } of expiredGrace) {
      pipeline.del(`billing:subscription:${userId}`)
    }
    await pipeline.exec()
  }

  return NextResponse.json({
    ok: true,
    reset: resetResult.count,
    trialExpired: expiredTrials.length,
    graceExpired: expiredGrace.length,
  })
}
