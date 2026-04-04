export const AGENT_LANGUAGES = ["pt-BR", "en"] as const;
export type AgentLanguage = typeof AGENT_LANGUAGES[number];

export const AGENT_TONES = [
  "amigavel", "formal", "casual", "empatico", "didatico",
  "tecnico", "analitico", "pragmatico", "direto", "criativo",
  "inspirador", "confiante"
] as const;
export type AgentTone = typeof AGENT_TONES[number];

export const AGENT_MODELS = [
  "gpt-4-turbo-preview", "gpt-4o", "gpt-4o-mini", "gpt-4", "gpt-3.5-turbo"
] as const;
export type AgentModel = typeof AGENT_MODELS[number];

export const AGENT_DEFAULTS = {
  language: "pt-BR" satisfies AgentLanguage,
  tone: "amigavel" satisfies AgentTone,
  model: "gpt-4o" satisfies AgentModel,
  temperature: 0.7,
  maxTokens: 300,
} as const;

export const TEMPERATURE_CONFIG = { min: 0, max: 1, step: 0.05 } as const;
export const MAX_TOKENS_CONFIG = { min: 200, max: 2000 } as const;

export const AGENT_PROMPT_SLUGS = ["system", "greeting", "fallback"] as const;
export type AgentPromptSlug = typeof AGENT_PROMPT_SLUGS[number];

export const AGENT_PROMPT_LABELS: Record<AgentPromptSlug, string> = {
  system: "System Prompt",
  greeting: "Greeting Message",
  fallback: "Fallback Message",
} as const;

export const AGENT_PROMPT_DESCRIPTIONS: Record<AgentPromptSlug, string> = {
  system: "Defines the agent identity, rules, tone and conversation flow",
  greeting: "Sent when a conversation starts or is reactivated",
  fallback: "Sent when an internal error occurs",
} as const;

export const AGENT_PROMPT_EDITOR_TYPE: Record<AgentPromptSlug, "markdown" | "whatsapp"> = {
  system: "markdown",
  greeting: "whatsapp",
  fallback: "whatsapp",
} as const;
