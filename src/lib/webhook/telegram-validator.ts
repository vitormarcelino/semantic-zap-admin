import { timingSafeEqual } from "crypto"

/**
 * Validates the X-Telegram-Bot-Api-Secret-Token header.
 * The secret is set during webhook registration via setWebhook's secret_token parameter.
 */
export function validateTelegramSignature(header: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || !header) return false
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(secret))
  } catch {
    // Buffer lengths differ — header is definitely wrong
    return false
  }
}
