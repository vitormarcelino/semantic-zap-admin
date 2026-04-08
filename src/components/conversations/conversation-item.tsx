import { Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConversationSummary } from "@/types/conversations"

interface ConversationItemProps {
  conversation: ConversationSummary
  isSelected: boolean
  onClick: () => void
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function formatPhone(phone: string): string {
  // Minimal formatting: +55 11 99999-9999
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  return `+${digits}`
}

const needsAttention = (c: ConversationSummary) =>
  c.mode === "human" && c.unreadCount > 0

export function ConversationItem({ conversation: c, isSelected, onClick }: ConversationItemProps) {
  const attention = needsAttention(c)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full text-left px-4 py-3 transition-colors border-b border-white/5",
        "hover:bg-white/4",
        isSelected ? "bg-white/6" : "",
        attention ? "border-l-2 border-l-amber-500/70 pl-3.5" : "border-l-2 border-l-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium text-white">
          {formatPhone(c.phoneNumber)}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-white/35">
          {relativeTime(c.lastMessageAt)}
        </span>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-white/45 max-w-[85%]">
          {c.lastMessage?.content ?? "No messages yet"}
        </p>

        <div className="flex shrink-0 items-center gap-1">
          {c.mode === "human" ? (
            <User size={11} className="text-amber-400" strokeWidth={1.5} />
          ) : (
            <Bot size={11} className="text-[#00D060]/60" strokeWidth={1.5} />
          )}
          {c.unreadCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 font-mono text-[9px] font-bold text-black">
              {c.unreadCount > 99 ? "99+" : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
