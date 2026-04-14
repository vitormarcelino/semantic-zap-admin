"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Link2,
  BarChart2,
  Settings,
  Zap,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: 3 },
  { href: "/agents", label: "Agentes", icon: Bot },
  { href: "/conversations", label: "Conversas", icon: MessageSquare },
  { href: "/webhooks", label: "Webhooks", icon: Link2 },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/billing", label: "Assinatura", icon: CreditCard },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/8 bg-[#181C26]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/8 px-5 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00D060]">
          <Zap
            size={14}
            className="text-[#081a0e]"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          SemanticZap
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[#00D060]/12 text-[#00D060]"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {label}
              </span>
              {badge !== undefined && (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-medium leading-none",
                    isActive
                      ? "bg-[#00D060] text-[#081a0e]"
                      : "bg-[#00D060]/20 text-[#00D060]"
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/8 px-5 py-3">
        <p className="font-mono text-[10px] text-white/20">v0.1.0</p>
      </div>
    </aside>
  )
}
