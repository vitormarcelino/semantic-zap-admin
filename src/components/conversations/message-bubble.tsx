import { cn } from "@/lib/utils"
import { StatusIndicator } from "./status-indicator"
import type { MessageRecord } from "@/types/conversations"

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
    <div className={cn("flex flex-col gap-1 max-w-[75%]", isOutbound ? "items-end self-end" : "items-start self-start")}>
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isOutbound
            ? "bg-[#00D060]/15 text-white rounded-br-sm"
            : "bg-white/8 text-white/90 rounded-bl-sm"
        )}
      >
        {message.content}
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
