import { MessageSquare, Activity, Bot } from "lucide-react"
import { Shell } from "@/components/layout/shell"
import { MetricCard } from "@/components/common/metric-card"
import { AgentCard } from "@/components/agents/agent-card"
import { SignOutButton } from "@/components/layout/sign-out-button"

const MOCK_AGENTS = [
  {
    id: "1",
    name: "Suporte Principal",
    phone: "+55 11 98765-4321",
    status: "online" as const,
    messagesCount: 1284,
    conversationsCount: 47,
    avgResponse: "1m 23s",
  },
  {
    id: "2",
    name: "Vendas & Promoções",
    phone: "+55 11 97654-3210",
    status: "warning" as const,
    messagesCount: 558,
    conversationsCount: 26,
    avgResponse: "3m 45s",
  },
]

export default function DashboardPage() {
  return (
    <Shell title="Dashboard" actions={<SignOutButton />}>
      <div className="flex flex-col gap-8">
        {/* Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            value="1.842"
            label="Mensagens"
            delta="12% vs ontem"
            deltaType="up"
            icon={MessageSquare}
          />
          <MetricCard
            value="98%"
            label="Uptime"
            delta="0.3% vs semana"
            deltaType="up"
            icon={Activity}
          />
          <MetricCard
            value="3"
            label="Agentes ativos"
            delta="1 desde ontem"
            deltaType="up"
            icon={Bot}
          />
        </section>

        {/* Agents */}
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/38">
            Agentes
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {MOCK_AGENTS.map((agent) => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </div>
        </section>
      </div>
    </Shell>
  )
}
