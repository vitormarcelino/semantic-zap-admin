import { Shell } from "@/components/layout/shell"
import { AgentForm } from "@/components/agents/agent-form"
import { createAgent } from "../actions"

export default function NewAgentPage() {
  return (
    <Shell title="Novo Agente">
      <AgentForm action={createAgent} />
    </Shell>
  )
}
