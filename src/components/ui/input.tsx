import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-lg border border-white/8 bg-[#0F1117] px-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors hover:border-white/16 focus:border-[#00D060]/50 focus:ring-1 focus:ring-[#00D060]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
