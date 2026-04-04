import { Sidebar } from "./sidebar"

interface ShellProps {
  children: React.ReactNode
  title: string
  actions?: React.ReactNode
}

export function Shell({ children, title, actions }: ShellProps) {
  return (
    <div className="flex h-screen bg-[#0F1117]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Inner header */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/8 px-6 py-4">
          <h1 className="text-base font-semibold text-white">{title}</h1>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-dot-grid p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
