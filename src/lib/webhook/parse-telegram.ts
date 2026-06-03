import type { NormalizedMessage } from "./types"

const MAX_VOICE_DURATION_SECONDS = 300

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: { id: number }
    chat: { id: number }
    date: number
    text?: string
    voice?: {
      file_id: string
      file_unique_id: string
      duration: number
      mime_type?: string
      file_size?: number
    }
  }
}

/**
 * Parses a Telegram Update payload into a NormalizedMessage.
 * Handles text and voice messages. Returns null for all other update types.
 */
export function parseTelegramPayload(update: TelegramUpdate): NormalizedMessage | null {
  const message = update.message
  if (!message) return null

  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  if (!botUsername) return null

  const base = {
    provider: "telegram" as const,
    messageId: String(update.update_id),
    from: String(message.chat.id),
    to: botUsername,
    timestamp: new Date(message.date * 1000),
  }

  if (message.text?.trim()) {
    return { ...base, body: message.text.trim() }
  }

  if (message.voice) {
    if (message.voice.duration > MAX_VOICE_DURATION_SECONDS) return null
    return { ...base, body: message.voice.file_id, mediaType: "voice" }
  }

  return null
}
