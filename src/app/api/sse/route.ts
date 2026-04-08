import { NextRequest } from "next/server"
import { createSSESubscriber } from "@/lib/realtime/subscriber"

export const dynamic = "force-dynamic"

const HEARTBEAT_INTERVAL_MS = 25_000

export async function GET(req: NextRequest): Promise<Response> {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = createSSESubscriber()

      // Send initial connected event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`))

      // Heartbeat to prevent proxy timeouts
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"))
        } catch {
          // Stream may be closed
        }
      }, HEARTBEAT_INTERVAL_MS)

      // Subscribe to Redis channel
      await subscriber.subscribe((event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // Stream may be closed
        }
      })

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        subscriber.unsubscribe().catch(() => {})
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
