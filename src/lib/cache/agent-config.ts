import { redis } from "./redis"

export type AgentConfig = {
  id: string
  name: string
  language: string
  tone: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string | null
  greetingPrompt: string | null
  fallbackPrompt: string | null
  provider: string | null
  phoneNumber: string | null
  whatsappPhoneNumberId: string | null
  whatsappAccessToken: string | null
  twilioAccountSid: string | null
  twilioAuthToken: string | null
  telegramBotToken: string | null
}

const PREFIX = "agent:config:"
const TTL = 300 // 5 minutes

export async function getAgentConfig(id: string): Promise<AgentConfig | null> {
  const raw = await redis.get(`${PREFIX}${id}`)
  if (!raw) return null
  return JSON.parse(raw) as AgentConfig
}

export async function setAgentConfig(config: AgentConfig): Promise<void> {
  await redis.setex(`${PREFIX}${config.id}`, TTL, JSON.stringify(config))
}

export async function invalidateAgentConfig(id: string): Promise<void> {
  await redis.del(`${PREFIX}${id}`)
}
