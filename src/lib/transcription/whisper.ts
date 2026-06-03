import OpenAI, { toFile } from "openai"

export class TranscriptionEmptyError extends Error {
  constructor() {
    super("Whisper returned empty transcription")
    this.name = "TranscriptionEmptyError"
  }
}

export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TranscriptionError"
  }
}

function toIso639_1(bcp47: string): string {
  return bcp47.split("-")[0].toLowerCase()
}

export async function transcribeAudio(audioBuffer: Buffer, language: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new TranscriptionError("OPENAI_API_KEY is not set")

  const openai = new OpenAI({ apiKey })
  const lang = toIso639_1(language)

  let text: string
  try {
    const file = await toFile(audioBuffer, "voice.ogg", { type: "audio/ogg" })
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: lang,
      response_format: "text",
    })
    text = typeof result === "string" ? result : (result as { text: string }).text ?? ""
  } catch (err) {
    throw new TranscriptionError(`Whisper API call failed: ${(err as Error).message}`)
  }

  if (!text.trim()) throw new TranscriptionEmptyError()
  return text.trim()
}
