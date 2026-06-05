import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors hover:border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
