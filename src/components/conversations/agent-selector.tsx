"use client"

import { Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAgents } from "@/hooks/useConversations"
import type { AgentSummary } from "@/types/conversations"

interface AgentSelectorProps {
  selectedAgentId: string | null
  onSelect: (agentId: string) => void
}

interface AgentItemProps {
  agent: AgentSummary
  isSelected: boolean
  onClick: () => void
}

function AgentItem({ agent, isSelected, onClick }: AgentItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "bg-[#00D060]/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white/80"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Bot
            size={14}
            className={cn(isSelected ? "text-[#00D060]" : "text-white/30")}
            strokeWidth={1.5}
          />
          <span className="truncate text-sm font-medium">{agent.name}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {agent.attentionCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 font-mono text-[9px] font-bold text-black">
              {agent.attentionCount}
            </span>
          )}
          <span
            className={cn(
              "font-mono text-[10px]",
              isSelected ? "text-white/50" : "text-white/25"
            )}
          >
            {agent.conversationCount}
          </span>
        </div>
      </div>

      {agent.phoneNumber && (
        <p className="mt-0.5 truncate font-mono text-[10px] text-white/25 pl-5">
          {agent.phoneNumber}
        </p>
      )}
    </button>
  )
}

export function AgentSelector({ selectedAgentId, onSelect }: AgentSelectorProps) {
  const { data: agents, isLoading } = useAgents()

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-white/8 bg-[#181C26]">
      <div className="border-b border-white/8 px-4 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-white/40">Agents</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-white/30" strokeWidth={1.5} />
          </div>
        ) : !agents || agents.length === 0 ? (
          <p className="py-8 text-center text-xs text-white/30">No agents found</p>
        ) : (
          agents.map((agent) => (
            <AgentItem
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onClick={() => onSelect(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
