import { cn } from "@/lib/utils"

type Status = "online" | "offline" | "error" | "warning"

const variants: Record<
  Status,
  { dot: string; pulse: boolean; label: string; text: string; bg: string }
> = {
  online: {
    dot: "bg-[#00D060]",
    pulse: true,
    label: "Online",
    text: "text-[#00D060]",
    bg: "bg-[#00D060]/10",
  },
  offline: {
    dot: "bg-white/25",
    pulse: false,
    label: "Offline",
    text: "text-white/38",
    bg: "bg-white/5",
  },
  error: {
    dot: "bg-[#EF4444]",
    pulse: false,
    label: "Erro",
    text: "text-[#EF4444]",
    bg: "bg-[#EF4444]/10",
  },
  warning: {
    dot: "bg-[#F59E0B]",
    pulse: false,
    label: "Atenção",
    text: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
  },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const v = variants[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
        v.bg,
        v.text,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {v.pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              v.dot
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            v.dot
          )}
        />
      </span>
      {v.label}
    </span>
  )
}
