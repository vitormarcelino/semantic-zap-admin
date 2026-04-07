import { notFound } from "next/navigation"
import { Shell } from "@/components/layout/shell"
import { AgentForm } from "@/components/agents/agent-form"
import { getAgent, updateAgent } from "../../actions"

interface EditAgentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { id } = await params
  const agent = await getAgent(id)

  if (!agent) notFound()

  const boundAction = updateAgent.bind(null, id)

  return (
    <Shell title="Editar Agente">
      <div className="mx-auto max-w-2xl">
        <AgentForm
          action={boundAction}
          defaultValues={{
            name: agent.name,
            description: agent.description,
            phoneNumber: agent.phoneNumber,
            provider: agent.provider,
            language: agent.language,
            tone: agent.tone,
            model: agent.model,
            temperature: agent.temperature,
            maxTokens: agent.maxTokens,
            systemPrompt: agent.systemPrompt,
            greetingPrompt: agent.greetingPrompt,
            fallbackPrompt: agent.fallbackPrompt,
          }}
        />
      </div>
    </Shell>
  )
}
