import twilio from "twilio"

export async function sendTwilio(to: string, from: string, parts: string[]): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN")
  }

  const client = twilio(accountSid, authToken)

  for (const body of parts) {
    await client.messages.create({ to, from, body })
  }
}
