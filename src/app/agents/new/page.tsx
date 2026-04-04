import { Shell } from "@/components/layout/shell"
import { AgentForm } from "@/components/agents/agent-form"
import { createAgent } from "../actions"

export default function NewAgentPage() {
  return (
    <Shell title="Novo Agente">
      <div className="mx-auto max-w-2xl">
        <AgentForm action={createAgent} />
      </div>
    </Shell>
  )
}
