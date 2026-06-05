import { cn } from "@/lib/utils"

type Status = "online" | "offline" | "error" | "warning"

const variants: Record<
  Status,
  { dot: string; pulse: boolean; label: string; text: string; bg: string }
> = {
  online: {
    dot: "bg-primary",
    pulse: true,
    label: "Online",
    text: "text-primary",
    bg: "bg-accent",
  },
  offline: {
    dot: "bg-muted-foreground/25",
    pulse: false,
    label: "Offline",
    text: "text-muted-foreground",
    bg: "bg-muted",
  },
  error: {
    dot: "bg-destructive",
    pulse: false,
    label: "Erro",
    text: "text-destructive",
    bg: "bg-destructive/10",
  },
  warning: {
    dot: "bg-amber-500",
    pulse: false,
    label: "Atenção",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
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
