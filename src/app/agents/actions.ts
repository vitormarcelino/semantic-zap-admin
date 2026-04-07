"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { uuidv7 } from "uuidv7"
import { prisma } from "@/lib/prisma"
import { AGENT_DEFAULTS } from "@/constants/agent"

export type ActionState = {
  error?: string
  fieldErrors?: Partial<Record<string, string>>
}

async function requireUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")
  return userId
}

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  })
}

export async function getAgents() {
  const userId = await requireUserId()
  return prisma.agent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getAgent(id: string) {
  const userId = await requireUserId()
  return prisma.agent.findFirst({
    where: { id, userId },
  })
}

export async function createAgent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId()

  const name = (formData.get("name") as string)?.trim()
  if (!name) return { fieldErrors: { name: "Nome é obrigatório" } }

  await ensureUser(userId)
  await prisma.agent.create({
    data: {
      id: uuidv7(),
      userId,
      name,
      description: (formData.get("description") as string) || null,
      language: (formData.get("language") as string) || AGENT_DEFAULTS.language,
      tone: (formData.get("tone") as string) || AGENT_DEFAULTS.tone,
      model: (formData.get("model") as string) || AGENT_DEFAULTS.model,
      temperature:
        parseFloat(formData.get("temperature") as string) ||
        AGENT_DEFAULTS.temperature,
      maxTokens:
        parseInt(formData.get("maxTokens") as string) ||
        AGENT_DEFAULTS.maxTokens,
      phoneNumber: (formData.get("phoneNumber") as string) || null,
      provider: (formData.get("provider") as string) || null,
      systemPrompt: (formData.get("systemPrompt") as string) || null,
      greetingPrompt: (formData.get("greetingPrompt") as string) || null,
      fallbackPrompt: (formData.get("fallbackPrompt") as string) || null,
    },
  })

  redirect("/agents")
}

export async function updateAgent(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId()

  const name = (formData.get("name") as string)?.trim()
  if (!name) return { fieldErrors: { name: "Nome é obrigatório" } }

  const existing = await prisma.agent.findFirst({ where: { id, userId } })
  if (!existing) return { error: "Agente não encontrado" }

  await prisma.agent.update({
    where: { id },
    data: {
      name,
      description: (formData.get("description") as string) || null,
      language: (formData.get("language") as string) || AGENT_DEFAULTS.language,
      tone: (formData.get("tone") as string) || AGENT_DEFAULTS.tone,
      model: (formData.get("model") as string) || AGENT_DEFAULTS.model,
      temperature:
        parseFloat(formData.get("temperature") as string) ||
        AGENT_DEFAULTS.temperature,
      maxTokens:
        parseInt(formData.get("maxTokens") as string) ||
        AGENT_DEFAULTS.maxTokens,
      phoneNumber: (formData.get("phoneNumber") as string) || null,
      provider: (formData.get("provider") as string) || null,
      systemPrompt: (formData.get("systemPrompt") as string) || null,
      greetingPrompt: (formData.get("greetingPrompt") as string) || null,
      fallbackPrompt: (formData.get("fallbackPrompt") as string) || null,
    },
  })

  redirect("/agents")
}

export async function deleteAgent(id: string): Promise<void> {
  const userId = await requireUserId()
  await prisma.agent.deleteMany({ where: { id, userId } })
  revalidatePath("/agents")
}
