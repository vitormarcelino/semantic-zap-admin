import { Check, CheckCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageStatus } from "@/types/conversations"

interface StatusIndicatorProps {
  status: MessageStatus
  provider?: string | null
}

export function StatusIndicator({ status, provider }: StatusIndicatorProps) {
  // Twilio only supports sent/failed — no delivery receipts
  if (provider === "twilio") {
    if (status === "failed") {
      return <X size={12} className="text-red-400" strokeWidth={2} />
    }
    return <Check size={12} className="text-white/40" strokeWidth={2} />
  }

  switch (status) {
    case "sent":
      return <Check size={12} className="text-white/40" strokeWidth={2} />
    case "delivered":
      return <CheckCheck size={12} className="text-white/40" strokeWidth={2} />
    case "read":
      return <CheckCheck size={12} className="text-blue-400" strokeWidth={2} />
    case "failed":
      return <X size={12} className="text-red-400" strokeWidth={2} />
    case "processing":
      return (
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "inline-block h-1 w-1 rounded-full bg-white/40 animate-bounce",
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
