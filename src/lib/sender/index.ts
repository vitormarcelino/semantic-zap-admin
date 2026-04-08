import { sendWhatsApp } from "./whatsapp"
import { sendTwilio } from "./twilio"

export interface SendOptions {
  provider: string | null
  to: string
  from: string
  parts: string[]
}

export async function sendMessage(opts: SendOptions): Promise<void> {
  const { provider, to, from, parts } = opts

  if (provider === "whatsapp") {
    await sendWhatsApp(to, parts)
  } else if (provider === "twilio") {
    await sendTwilio(to, from, parts)
  } else {
    throw new Error(`Unknown or missing provider: ${provider}`)
  }
}
