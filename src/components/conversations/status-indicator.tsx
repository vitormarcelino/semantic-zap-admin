import { Check, CheckCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageStatus } from "@/types/conversations"

interface StatusIndicatorProps {
  status: MessageStatus
  provider?: string | null
}

export function StatusIndicator({ status, provider }: StatusIndicatorProps) {
  if (provider === "twilio") {
    if (status === "failed") {
      return <X size={12} className="text-destructive" strokeWidth={2} />
    }
    return <Check size={12} className="text-muted-foreground/50" strokeWidth={2} />
  }

  switch (status) {
    case "sent":
      return <Check size={12} className="text-muted-foreground/50" strokeWidth={2} />
    case "delivered":
      return <CheckCheck size={12} className="text-muted-foreground/50" strokeWidth={2} />
    case "read":
      return <CheckCheck size={12} className="text-blue-500 dark:text-blue-400" strokeWidth={2} />
    case "failed":
      return <X size={12} className="text-destructive" strokeWidth={2} />
    case "processing":
      return (
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "inline-block h-1 w-1 animate-bounce rounded-full bg-muted-foreground/40",
              )}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      )
    default:
      return null
  }
}
