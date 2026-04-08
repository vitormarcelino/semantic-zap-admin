// scripts/test-agent.ts
// Usage: npx tsx --tsconfig tsconfig.worker.json scripts/test-agent.ts
import dotenv from "dotenv"
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local", override: true })

import { prisma } from "@/lib/prisma"
import { enqueueMessage } from "@/lib/queue/producer"

async function main() {
  // 1. Busca um agente real do banco
  const agent = await prisma.agent.findFirst()

  if (!agent) {
    console.error("Nenhum agente encontrado.")
    process.exit(1)
  }

  const testPhoneNumber = agent.phoneNumber ?? "5511999999999"
  console.log(`Usando agente: ${agent.name} | Número: ${testPhoneNumber}`)

  // 2. Faz upsert da conversa
  const conversation = await prisma.conversation.upsert({
    where: {
      agentId_phoneNumber: {
        agentId: agent.id,
        phoneNumber: "5511999999999" // número do "usuário" de teste
      }
    },
    create: {
      agentId: agent.id,
      phoneNumber: "5511999999999",
      status: "active"
    },
    update: {
      lastMessageAt: new Date()
    }
  })

  // 3. Salva a mensagem como o webhook faria
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: "Olá, preciso de ajuda com meu pedido",
      status: "pending",
      wamid: `test-wamid-${Date.now()}` // wamid fake único
    }
  })

  console.log(`Mensagem criada: ${message.id}`)

  // 4. Enfileira o job
  await enqueueMessage({
    messageId: message.id,
    conversationId: conversation.id,
    agentId: agent.id
  })

  console.log("Job enfileirado! Aguarde o worker processar...")
  console.log(`Acompanhe no banco: SELECT * FROM "Message" WHERE "conversationId" = '${conversation.id}';`)

  await prisma.$disconnect()
  process.exit(0)
}

main().catch(console.error)