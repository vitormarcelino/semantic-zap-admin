import type { NormalizedMessage } from "./types"

// Minimal typings for the Meta Cloud API payload we care about
interface MetaEntry {
  changes?: Array<{
    value?: {
      messages?: Array<{
        id: string
        from: string
        type: string
        timestamp: string
        text?: { body: string }
      }>
      metadata?: { display_phone_number: string; phone_number_id: string }
    }
  }>
}

interface MetaPayload {
  object?: string
  entry?: MetaEntry[]
}

/**
 * Extracts the first text message from a Meta Cloud API payload.
 * Returns null for non-text messages, status updates, or malformed payloads.
 */
export function parseWhatsAppPayload(payload: MetaPayload): NormalizedMessage | null {
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  const metadata = payload.entry?.[0]?.changes?.[0]?.value?.metadata

  if (!message || message.type !== "text" || !message.text?.body) return null
  if (!metadata?.display_phone_number) return null

  return {
    provider: "whatsapp",
    messageId: message.id,
    from: message.from,
    to: metadata.display_phone_number.replace(/\D/g, ""),
    body: message.text.body,
    timestamp: new Date(parseInt(message.timestamp, 10) * 1000),
  }
}
