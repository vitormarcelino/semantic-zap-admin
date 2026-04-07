"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Save, ArrowLeft } from "lucide-react"
import type { ActionState } from "@/app/agents/actions"
import {
  AGENT_LANGUAGES,
  AGENT_TONES,
  AGENT_MODELS,
  AGENT_DEFAULTS,
  TEMPERATURE_CONFIG,
  MAX_TOKENS_CONFIG,
} from "@/constants/agent"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { WhatsappEditor } from "@/components/ui/whatsapp-editor"
import {
  AGENT_PROMPT_LABELS,
  AGENT_PROMPT_DESCRIPTIONS,
} from "@/constants/agent"

const LANGUAGE_LABELS: Record<string, string> = {
  "pt-BR": "Português (BR)",
  en: "English",
}

const TONE_LABELS: Record<string, string> = {
  amigavel: "Amigável",
  formal: "Formal",
  casual: "Casual",
  empatico: "Empático",
  didatico: "Didático",
  tecnico: "Técnico",
  analitico: "Analítico",
  pragmatico: "Pragmático",
  direto: "Direto",
  criativo: "Criativo",
  inspirador: "Inspirador",
  confiante: "Confiante",
}

const PROVIDER_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "twilio", label: "Twilio" },
]

type AgentDefaults = {
  name?: string
  description?: string | null
  phoneNumber?: string | null
  provider?: string | null
  language?: string
  tone?: string
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string | null
  greetingPrompt?: string | null
  fallbackPrompt?: string | null
}

interface AgentFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: AgentDefaults
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#1F2535]">
      <div className="border-b border-white/8 px-5 py-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-white/38">
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg bg-[#00D060] px-4 py-2 text-sm font-medium text-[#081a0e] transition-colors hover:bg-[#00A84F] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Save size={14} strokeWidth={1.5} strokeLinecap="round" />
      {pending ? "Salvando..." : "Salvar"}
    </button>
  )
}

export function AgentForm({ action, defaultValues }: AgentFormProps) {
  const [state, formAction] = useActionState(action, {})

  const [provider, setProvider] = useState(
    defaultValues?.provider ?? ""
  )
  const [language, setLanguage] = useState(
    defaultValues?.language ?? AGENT_DEFAULTS.language
  )
  const [tone, setTone] = useState(defaultValues?.tone ?? AGENT_DEFAULTS.tone)
  const [model, setModel] = useState(
    defaultValues?.model ?? AGENT_DEFAULTS.model
  )
  const [temperature, setTemperature] = useState(
    defaultValues?.temperature ?? AGENT_DEFAULTS.temperature
  )
  const [maxTokens, setMaxTokens] = useState(
    defaultValues?.maxTokens ?? AGENT_DEFAULTS.maxTokens
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Identidade */}
      <FormSection title="Identidade">
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Suporte ao Cliente"
              defaultValue={defaultValues?.name ?? ""}
              aria-invalid={!!state.fieldErrors?.name}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-red-400">{state.fieldErrors.name}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a finalidade deste agente..."
              defaultValue={defaultValues?.description ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phoneNumber">Número de Telefone</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="+55 11 99999-9999"
                defaultValue={defaultValues?.phoneNumber ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="provider" value={provider} />
            </div>
          </div>
        </div>
      </FormSection>

      {/* Comportamento */}
      <FormSection title="Comportamento">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="language" value={language} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tom / Estilo</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TONE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="tone" value={tone} />
          </div>
        </div>
      </FormSection>

      {/* Modelo */}
      <FormSection title="Modelo">
        <div className="grid gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>Modelo LLM</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="model" value={model} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Criatividade</Label>
              <span className="font-mono text-xs text-white/38">
                {temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={TEMPERATURE_CONFIG.min}
              max={TEMPERATURE_CONFIG.max}
              step={TEMPERATURE_CONFIG.step}
            />
            <input type="hidden" name="temperature" value={temperature} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Tokens máximos</Label>
              <span className="font-mono text-xs text-white/38">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([v]) => setMaxTokens(v)}
              min={MAX_TOKENS_CONFIG.min}
              max={MAX_TOKENS_CONFIG.max}
              step={50}
            />
            <input type="hidden" name="maxTokens" value={maxTokens} />
          </div>
        </div>
      </FormSection>

      {/* Prompts */}
      <FormSection title="Prompts">
        <div className="grid gap-6">
          <div className="flex flex-col gap-1.5">
            <Label>{AGENT_PROMPT_LABELS.system}</Label>
            <p className="text-xs text-white/38">
              {AGENT_PROMPT_DESCRIPTIONS.system}
            </p>
            <MarkdownEditor
              name="systemPrompt"
              defaultValue={defaultValues?.systemPrompt}
              placeholder="Você é um assistente especializado em..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{AGENT_PROMPT_LABELS.greeting}</Label>
            <p className="text-xs text-white/38">
              {AGENT_PROMPT_DESCRIPTIONS.greeting}
            </p>
            <WhatsappEditor
              name="greetingPrompt"
              defaultValue={defaultValues?.greetingPrompt}
              placeholder="Olá! Como posso te ajudar hoje? 😊"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{AGENT_PROMPT_LABELS.fallback}</Label>
            <p className="text-xs text-white/38">
              {AGENT_PROMPT_DESCRIPTIONS.fallback}
            </p>
            <WhatsappEditor
              name="fallbackPrompt"
              defaultValue={defaultValues?.fallbackPrompt}
              placeholder="Desculpe, ocorreu um erro. Por favor, tente novamente."
            />
          </div>
        </div>
      </FormSection>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/agents"
          className="flex items-center gap-1.5 rounded-lg border border-white/8 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:border-white/16 hover:text-white"
        >
          <ArrowLeft size={14} strokeWidth={1.5} strokeLinecap="round" />
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  )
}
