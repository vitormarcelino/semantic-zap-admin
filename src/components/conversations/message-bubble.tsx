import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { StatusIndicator } from "./status-indicator"
import type { MessageRecord } from "@/types/conversations"

// Parses WhatsApp-style markup into React nodes.
// Supported: *bold*, _italic_, ~strikethrough~, `mono`, and \n line breaks.
function parseWhatsApp(text: string): React.ReactNode {
  // Split into lines first to handle \n
  const lines = text.split("\n")
  return lines.map((line, lineIdx) => {
    const nodes = parseInline(line)
    return (
      <Fragment key={lineIdx}>
        {nodes}
        {lineIdx < lines.length - 1 && <br />}
      </Fragment>
    )
  })
}

type Token =
  | { type: "bold"; children: React.ReactNode }
  | { type: "italic"; children: React.ReactNode }
  | { type: "strike"; children: React.ReactNode }
  | { type: "mono"; text: string }
  | { type: "text"; text: string }

function parseInline(line: string): React.ReactNode {
  // Pattern matches *bold*, _italic_, ~strike~, `mono`
  const pattern = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`)/g
  const tokens: Token[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: line.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith("*")) {
      tokens.push({ type: "bold", children: raw.slice(1, -1) })
    } else if (raw.startsWith("_")) {
      tokens.push({ type: "italic", children: raw.slice(1, -1) })
    } else if (raw.startsWith("~")) {
      tokens.push({ type: "strike", children: raw.slice(1, -1) })
    } else if (raw.startsWith("`")) {
      tokens.push({ type: "mono", text: raw.slice(1, -1) })
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "text", text: line.slice(lastIndex) })
  }

  return tokens.map((tok, i) => {
    if (tok.type === "text") return <Fragment key={i}>{tok.text}</Fragment>
    if (tok.type === "bold") return <strong key={i} className="font-semibold">{tok.children}</strong>
    if (tok.type === "italic") return <em key={i}>{tok.children}</em>
    if (tok.type === "strike") return <s key={i}>{tok.children}</s>
    if (tok.type === "mono") return <code key={i} className="rounded bg-white/10 px-1 font-mono text-[0.85em]">{tok.text}</code>
  })
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

interface MessageBubbleProps {
  message: MessageRecord
  provider?: string | null
}

function SenderBadge({ sentBy }: { sentBy: string | null }) {
  if (!sentBy) return null
  if (sentBy === "bot") {
    return (
      <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-medium bg-white/10 text-white/50">
        Bot
      </span>
    )
  }
  if (sentBy.startsWith("operator:")) {
    return (
      <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-medium bg-blue-500/20 text-blue-400">
        Operator
      </span>
    )
  }
  return null
}

export function MessageBubble({ message, provider }: MessageBubbleProps) {
  const isOutbound = message.role === "assistant"

  return (
    <div className={cn("flex flex-col gap-1", isOutbound ? "items-end self-end" : "items-start self-start")}>
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words",
          isOutbound
            ? "bg-[#00D060]/15 text-white rounded-br-sm"
            : "bg-white/8 text-white/90 rounded-bl-sm"
        )}
      >
        {parseWhatsApp(message.content)}
      </div>

      <div className={cn("flex items-center gap-1.5 px-1", isOutbound ? "flex-row-reverse" : "flex-row")}>
        <span className="font-mono text-[10px] text-white/30">
          {relativeTime(message.createdAt)}
        </span>
        {isOutbound && <SenderBadge sentBy={message.sentBy} />}
        {isOutbound && (
          <StatusIndicator status={message.status} provider={provider} />
        )}
      </div>
    </div>
  )
}
