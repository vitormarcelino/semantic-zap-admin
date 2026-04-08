"use client"

import { useEffect, useRef, useState } from "react"
import type { SSEEvent } from "@/types/conversations"

const MIN_RETRY_DELAY = 3_000
const MAX_RETRY_DELAY = 30_000

export function useSSE(onEvent: (event: SSEEvent) => void): { connected: boolean } {
  const [connected, setConnected] = useState(false)
  const onEventRef = useRef(onEvent)
  const retryDelayRef = useRef(MIN_RETRY_DELAY)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const esRef = useRef<EventSource | null>(null)

  // Keep the callback ref current without re-triggering the effect
  useEffect(() => {
    onEventRef.current = onEvent
  })

  useEffect(() => {
    let cancelled = false

    function connect() {
      if (cancelled) return

      const es = new EventSource("/api/sse")
      esRef.current = es

      es.onopen = () => {
        if (!cancelled) {
          setConnected(true)
          retryDelayRef.current = MIN_RETRY_DELAY
        }
      }

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as SSEEvent
          if (!cancelled && parsed.type !== "connected") {
            onEventRef.current(parsed)
          }
        } catch {
          // ignore malformed events
        }
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        if (!cancelled) {
          setConnected(false)
          retryTimeoutRef.current = setTimeout(() => {
            retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY)
            connect()
          }, retryDelayRef.current)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      esRef.current?.close()
      esRef.current = null
      setConnected(false)
    }
  }, [])

  return { connected }
}
