import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full resize-none rounded-lg border border-white/8 bg-[#0F1117] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-colors hover:border-white/16 focus:border-[#00D060]/50 focus:ring-1 focus:ring-[#00D060]/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
