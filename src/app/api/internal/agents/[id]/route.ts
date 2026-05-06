import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { setAgentConfig, invalidateAgentConfig, type AgentConfig } from "@/lib/cache/agent-config"

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-internal-secret")
  return secret === process.env.INTERNAL_API_SECRET
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      language: true,
      tone: true,
      model: true,
      temperature: true,
      maxTokens: true,
      systemPrompt: true,
      greetingPrompt: true,
      fallbackPrompt: true,
      provider: true,
      phoneNumber: true,
      whatsappPhoneNumberId: true,
      whatsappAccessToken: true,
      twilioAccountSid: true,
      twilioAuthToken: true,
      telegramBotToken: true,
    },
  })

  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const config: AgentConfig = agent
  await setAgentConfig(config)

  return NextResponse.json(config)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await invalidateAgentConfig(id)

  return NextResponse.json({ ok: true })
}
