import { validateRequest } from "twilio"
import type { NextRequest } from "next/server"

/**
 * Validates the X-Twilio-Signature header.
 * Reconstructs the full URL from forwarded headers (required behind proxies/Vercel).
 */
export function validateTwilioSignature(req: NextRequest, params: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) return false

  const signature = req.headers.get("x-twilio-signature") ?? ""

  // Reconstruct full URL — proxies (Vercel, Railway) rewrite the host header
  const proto = req.headers.get("x-forwarded-proto") ?? "https"
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? ""
  const pathname = new URL(req.url).pathname
  const url = `${proto}://${host}${pathname}`

  return validateRequest(authToken, signature, url, params)
}
