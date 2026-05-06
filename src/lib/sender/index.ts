import { sendWhatsApp } from "./whatsapp"
import { sendTwilio } from "./twilio"
import { sendTelegram } from "./telegram"

export interface SendOptions {
  provider: string | null
  to: string
  from: string
  parts: string[]
  credentials: {
    whatsappPhoneNumberId?: string | null
    whatsappAccessToken?: string | null
    twilioAccountSid?: string | null
    twilioAuthToken?: string | null
    telegramBotToken?: string | null
  }
}

export async function sendMessage(opts: SendOptions): Promise<void> {
  const { provider, to, from, parts, credentials } = opts

  if (provider === "whatsapp") {
    if (!credentials.whatsappPhoneNumberId || !credentials.whatsappAccessToken) {
      throw new Error("Missing WhatsApp credentials on agent")
    }
    await sendWhatsApp(to, parts, credentials.whatsappPhoneNumberId, credentials.whatsappAccessToken)
  } else if (provider === "twilio") {
    if (!credentials.twilioAccountSid || !credentials.twilioAuthToken) {
      throw new Error("Missing Twilio credentials on agent")
    }
    await sendTwilio(to, from, parts, credentials.twilioAccountSid, credentials.twilioAuthToken)
  } else if (provider === "telegram") {
    if (!credentials.telegramBotToken) {
      throw new Error("Missing Telegram credentials on agent")
    }
    await sendTelegram(to, parts, credentials.telegramBotToken)
  } else {
    throw new Error(`Unknown or missing provider: ${provider}`)
  }
}
