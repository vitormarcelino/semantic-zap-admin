export async function sendTelegram(chatId: string, parts: string[], token: string): Promise<void> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`

  for (const text of parts) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Telegram send failed (${res.status}): ${body}`)
    }
  }
}
