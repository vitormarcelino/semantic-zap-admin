export class TelegramDownloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TelegramDownloadError"
  }
}

const TIMEOUT_MS = 10_000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function downloadTelegramVoice(fileId: string, botToken: string): Promise<Buffer> {
  const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`

  let filePath: string
  try {
    const res = await fetchWithTimeout(getFileUrl)
    const json = (await res.json()) as { ok: boolean; result?: { file_path: string } }
    if (!json.ok || !json.result?.file_path) {
      throw new TelegramDownloadError(`getFile returned ok=false for file_id=${fileId}`)
    }
    filePath = json.result.file_path
  } catch (err) {
    if (err instanceof TelegramDownloadError) throw err
    throw new TelegramDownloadError(`getFile request failed: ${(err as Error).message}`)
  }

  try {
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`
    const res = await fetchWithTimeout(downloadUrl)
    if (!res.ok) {
      throw new TelegramDownloadError(`Audio download failed with status ${res.status}`)
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    if (err instanceof TelegramDownloadError) throw err
    throw new TelegramDownloadError(`Audio download request failed: ${(err as Error).message}`)
  }
}
