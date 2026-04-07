import type { NormalizedMessage } from "./types"

/**
 * Parses a Twilio form-encoded webhook body into a NormalizedMessage.
 * Strips the "whatsapp:" prefix Twilio adds to From/To numbers.
 * Returns null if the message body is empty.
 */
export function parseTwilioPayload(params: Record<string, string>): NormalizedMessage | null {
  const body = params["Body"]?.trim()
  const from = params["From"]?.replace(/^whatsapp:/i, "").replace(/\D/g, "")
  const to = params["To"]?.replace(/^whatsapp:/i, "").replace(/\D/g, "")
  const smsSid = params["SmsSid"] ?? params["MessageSid"]

  if (!body || !from || !to || !smsSid) return null

  return {
    provider: "twilio",
    messageId: smsSid,
    from,
    to,
    body,
    timestamp: new Date(),
  }
}
