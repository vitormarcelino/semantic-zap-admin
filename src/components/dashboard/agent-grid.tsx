import Link from "next/link"
import { Plus } from "lucide-react"
import { AgentDashboardCard } from "./agent-card"
import type { AgentMetrics } from "@/lib/dashboard/queries"

interface AgentGridProps {
  agents: AgentMetrics[]
}

export function AgentGrid({ agents }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/8 py-16 text-center">
        <p className="text-sm text-white/38">Nenhum agente criado ainda</p>
        <Link
          href="/agents/new"
          className="flex items-center gap-1.5 rounded-md bg-[#00D060] px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          <Plus size={16} strokeWidth={1.5} />
          Criar primeiro agente
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentDashboardCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}
