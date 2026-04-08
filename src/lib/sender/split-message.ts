const DEFAULT_MAX_LEN = 1500

export function splitMessage(text: string, maxLen = DEFAULT_MAX_LEN): string[] {
  if (text.length <= maxLen) return [text]

  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) ?? [text]
  const parts: string[] = []
  let current = ""

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence
    if (candidate.length > maxLen) {
      if (current) parts.push(current.trim())
      // If a single sentence exceeds the limit, split it hard at maxLen
      if (sentence.length > maxLen) {
        let remaining = sentence
        while (remaining.length > maxLen) {
          parts.push(remaining.slice(0, maxLen).trim())
          remaining = remaining.slice(maxLen)
        }
        current = remaining
      } else {
        current = sentence
      }
    } else {
      current = candidate
    }
  }

  if (current.trim()) parts.push(current.trim())

  return parts.length ? parts : [text]
}
