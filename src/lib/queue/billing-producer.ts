import { Queue } from "bullmq"
import { redis } from "@/lib/cache/redis"

export interface BillingJobPayload {
  userId: string
}

let billingQueue: Queue<BillingJobPayload> | null = null

function getBillingQueue(): Queue<BillingJobPayload> {
  if (!billingQueue) {
    billingQueue = new Queue<BillingJobPayload>("billing", { connection: redis })
  }
  return billingQueue
}

export async function enqueueBillingJob(
  name: string,
  payload: BillingJobPayload,
  delayMs?: number
): Promise<void> {
  await getBillingQueue().add(name, payload, {
    delay: delayMs,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  })
}
