import Link from "next/link"
import { Plus, Bot } from "lucide-react"
import { Shell } from "@/components/layout/shell"
import { AgentManagementCard } from "@/components/agents/agent-management-card"
import { getAgents } from "./actions"

export default async function AgentsPage() {
  const agents = await getAgents()

  return (
    <Shell
      title="Agentes"
      actions={
        <Link
          href="/agents/new"
          className="flex items-center gap-1.5 rounded-lg bg-[#00D060] px-3 py-1.5 text-sm font-medium text-[#081a0e] transition-colors hover:bg-[#00A84F]"
        >
          <Plus size={14} strokeWidth={2} strokeLinecap="round" />
          Novo Agente
        </Link>
      }
    >
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/8 bg-[#1F2535] py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D060]/10">
            <Bot
              size={24}
              className="text-[#00D060]"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium text-white">
              Nenhum agente cadastrado
            </p>
            <p className="text-xs text-white/38">
              Crie seu primeiro agente para começar
            </p>
          </div>
          <Link
            href="/agents/new"
            className="flex items-center gap-1.5 rounded-lg bg-[#00D060] px-4 py-2 text-sm font-medium text-[#081a0e] transition-colors hover:bg-[#00A84F]"
          >
            <Plus size={14} strokeWidth={2} strokeLinecap="round" />
            Criar agente
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentManagementCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </Shell>
  )
}
