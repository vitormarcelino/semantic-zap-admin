import { Queue } from "bullmq"
import IORedis from "ioredis"
import type { EnqueuePayload } from "@/lib/webhook/types"

const globalForQueue = globalThis as unknown as { agentQueue: Queue<EnqueuePayload> }

export const agentQueue: Queue<EnqueuePayload> =
  globalForQueue.agentQueue ??
  new Queue<EnqueuePayload>("agent-messages", {
    connection: new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    }),
  })

if (process.env.NODE_ENV !== "production") globalForQueue.agentQueue = agentQueue

export async function enqueueMessage(payload: EnqueuePayload): Promise<void> {
  await agentQueue.add("process", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  })
}
