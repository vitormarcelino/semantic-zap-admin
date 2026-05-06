import twilio from "twilio"

export async function sendTwilio(to: string, from: string, parts: string[], accountSid: string, authToken: string): Promise<void> {
  const client = twilio(accountSid, authToken)

  // Twilio WhatsApp requires the "whatsapp:" prefix on both From and To
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`
  const toAddr = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`

  for (const body of parts) {
    await client.messages.create({ to: toAddr, from: fromAddr, body })
  }
}
