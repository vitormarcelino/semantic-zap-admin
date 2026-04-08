import { redis } from "@/lib/cache/redis"
import type { SSEEvent } from "@/types/conversations"

const SSE_CHANNEL = "sse:conversations"

export async function publishSSEEvent(event: SSEEvent): Promise<void> {
  try {
    await redis.publish(SSE_CHANNEL, JSON.stringify(event))
  } catch (err) {
    console.error("[realtime/publisher] Failed to publish SSE event:", err)
  }
}
