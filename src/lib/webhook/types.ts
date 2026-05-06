export type Provider = "whatsapp" | "twilio" | "telegram"

export type NormalizedMessage = {
  provider: Provider
  messageId: string  // wamid (WhatsApp) or SmsSid (Twilio)
  from: string       // sender digits only, e.g. "5511999999999"
  to: string         // receiving number digits only
  body: string       // message text content
  timestamp: Date
}

export type EnqueuePayload = {
  messageId: string       // Message.id (Prisma cuid)
  conversationId: string
  agentId: string
}
