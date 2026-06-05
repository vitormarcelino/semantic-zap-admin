"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Alternar tema"
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {resolvedTheme === "dark" ? (
        <Sun size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Moon size={14} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </button>
  )
}
