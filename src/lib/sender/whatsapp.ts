export async function sendWhatsApp(to: string, parts: string[]): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !token) {
    throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN")
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`

  for (const text of parts) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`WhatsApp send failed (${res.status}): ${body}`)
    }
  }
}
