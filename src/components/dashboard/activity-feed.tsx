import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import type { RecentActivityItem } from "@/lib/dashboard/queries"

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `${diffMin}min atrás`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h atrás`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d atrás`
}

interface ActivityFeedProps {
  items: RecentActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/38">
        Nenhuma atividade recente
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {items.map((item) => {
        const isIncoming = item.role === "user"
        const preview =
          item.content.length > 80
            ? item.content.slice(0, 80) + "…"
            : item.content

        return (
          <li key={item.messageId}>
            <Link
              href={`/conversations?agentId=${item.agentId}&conversationId=${item.conversationId}`}
              className="flex items-start gap-3 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <span className="mt-0.5 shrink-0">
                {isIncoming ? (
                  <ArrowDownLeft
                    size={14}
                    strokeWidth={1.5}
                    className="text-blue-400"
                  />
                ) : (
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                    className="text-[#00D060]"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/8 px-1.5 py-0.5 text-xs text-white/60">
                    {item.agentName}
                  </span>
                  <span className="font-mono text-xs text-white/38">
                    {item.phoneNumber}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-white/60">{preview}</p>
              </div>
              <span className="shrink-0 text-xs text-white/25">
                {relativeTime(item.createdAt)}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
