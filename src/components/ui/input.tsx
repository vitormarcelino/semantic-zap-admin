import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors hover:border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
