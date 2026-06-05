"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agentes", icon: Bot },
  { href: "/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/billing", label: "Assinatura", icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center border-b border-border px-5 py-4">
        <Image
          src="/semanticzap-light.svg"
          alt="SemanticZap"
          width={140}
          height={32}
          className="dark:hidden"
          priority
        />
        <Image
          src="/semanticzap-dark.svg"
          alt="SemanticZap"
          width={140}
          height={32}
          className="hidden dark:block"
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <p className="font-mono text-[10px] text-muted-foreground/50">v0.1.0</p>
        <ThemeToggle />
      </div>
    </aside>
  )
}
