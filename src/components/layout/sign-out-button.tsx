"use client"

import { useClerk } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const { signOut } = useClerk()

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut
        size={16}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      Sign out
    </button>
  )
}
