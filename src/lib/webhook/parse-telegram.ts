import type { NormalizedMessage } from "./types"

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number }
    chat: { id: number }
    date: number
    text?: string
  }
}

/**
 * Parses a Telegram Update payload into a NormalizedMessage.
 * Returns null for non-text updates (stickers, polls, etc.) or malformed payloads.
 */
export function parseTelegramPayload(update: TelegramUpdate): NormalizedMessage | null {
  const message = update.message
  if (!message?.text?.trim()) return null

  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) return null

  return {
    provider: "telegram",
    messageId: String(update.update_id),
    from: String(message.chat.id),
    to: botUsername,
    body: message.text.trim(),
    timestamp: new Date(message.date * 1000),
  }
}
