import { Worker } from "bullmq"
import { redis } from "@/lib/cache/redis"
import { processMessageJob } from "@/lib/queue/jobs/process-message"
import type { EnqueuePayload } from "@/lib/webhook/types"

const globalForWorker = globalThis as unknown as { agentWorker: Worker<EnqueuePayload> }

export const agentWorker: Worker<EnqueuePayload> =
  globalForWorker.agentWorker ??
  new Worker<EnqueuePayload>(
    "agent-messages",
    (job) => processMessageJob(job.data),
    {
      connection: redis,
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    }
  )

agentWorker.on("completed", (job) =>
  console.log(`[worker] job ${job.id} completed`)
)
agentWorker.on("failed", (job, err) =>
  console.error(`[worker] job ${job?.id} failed:`, err.message)
)
agentWorker.on("error", (err) =>
  console.error("[worker] error:", err)
)

if (process.env.NODE_ENV !== "production") globalForWorker.agentWorker = agentWorker
