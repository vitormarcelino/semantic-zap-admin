"use client"

import { useClerk } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const { signOut } = useClerk()

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white"
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
