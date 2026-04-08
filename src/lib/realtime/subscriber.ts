import { redis } from "@/lib/cache/redis"
import type { SSEEvent } from "@/types/conversations"

const SSE_CHANNEL = "sse:conversations"

export interface SSESubscriber {
  subscribe: (onEvent: (event: SSEEvent) => void) => Promise<void>
  unsubscribe: () => Promise<void>
}

export function createSSESubscriber(): SSESubscriber {
  // Use a dedicated connection — the main redis client has maxRetriesPerRequest: null
  // which is required by BullMQ but conflicts with pub/sub mode
  const sub = redis.duplicate()

  sub.on("error", (err) => {
    console.error("[realtime/subscriber] Redis error:", err)
  })

  return {
    async subscribe(onEvent: (event: SSEEvent) => void): Promise<void> {
      await sub.subscribe(SSE_CHANNEL)
      sub.on("message", (_channel, message) => {
        try {
          const event = JSON.parse(message) as SSEEvent
          onEvent(event)
        } catch {
          console.warn("[realtime/subscriber] Failed to parse SSE event:", message)
        }
      })
    },
    async unsubscribe(): Promise<void> {
      try {
        await sub.unsubscribe(SSE_CHANNEL)
        sub.disconnect()
      } catch (err) {
        console.error("[realtime/subscriber] Error during unsubscribe:", err)
      }
    },
  }
}
