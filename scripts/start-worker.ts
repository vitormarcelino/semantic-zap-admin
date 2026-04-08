import dotenv from "dotenv"
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local", override: true })

import { agentWorker } from "@/lib/queue/consumer"
import { redis } from "@/lib/cache/redis"

console.log("[worker] started — listening on queue: agent-messages")

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received — shutting down gracefully`)
  await agentWorker.close()
  redis.disconnect()
  process.exit(0)
}

process.on("SIGTERM", () => void shutdown("SIGTERM"))
process.on("SIGINT", () => void shutdown("SIGINT"))
