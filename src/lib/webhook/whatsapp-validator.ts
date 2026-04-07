import { createHmac, timingSafeEqual } from "crypto"

/**
 * Validates X-Hub-Signature-256 header from Meta Cloud API.
 * Must receive the raw body string (before any JSON.parse).
 */
export function validateWhatsAppSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.WHATSAPP_APP_SECRET) return false

  const expected = `sha256=${createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest("hex")}`

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    // Buffer lengths differ — signature is definitely wrong
    return false
  }
}
