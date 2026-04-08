import { prisma } from "@/lib/prisma"
import type { ConversationMode } from "@/types/conversations"

const MESSAGES_PER_PAGE = 30

export interface ConversationListFilters {
  agentId: string
  page?: number
  limit?: number
  mode?: ConversationMode
  search?: string
}

export async function listConversations(filters: ConversationListFilters) {
  const { agentId, page = 1, limit = MESSAGES_PER_PAGE, mode, search } = filters

  const where = {
    agentId,
    ...(mode ? { mode } : {}),
    ...(search ? { phoneNumber: { contains: search } } : {}),
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        agent: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true, status: true },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ])

  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      agentId: c.agentId,
      agentName: c.agent.name,
      phoneNumber: c.phoneNumber,
      mode: c.mode as ConversationMode,
      status: c.status,
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt.toISOString(),
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content,
            role: c.messages[0].role as "user" | "assistant",
            status: c.messages[0].status,
          }
        : null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  }
}

export async function getConversationWithMessages(id: string, messagesPage = 1) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      agent: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        skip: (messagesPage - 1) * MESSAGES_PER_PAGE,
        take: MESSAGES_PER_PAGE,
        select: {
          id: true,
          role: true,
          content: true,
          status: true,
          wamid: true,
          sentBy: true,
          deliveredAt: true,
          readAt: true,
          createdAt: true,
        },
      },
      _count: { select: { messages: true } },
    },
  })

  if (!conversation) return null

  return {
    id: conversation.id,
    agentId: conversation.agentId,
    agentName: conversation.agent.name,
    phoneNumber: conversation.phoneNumber,
    mode: conversation.mode as ConversationMode,
    assignedTo: conversation.assignedTo,
    messages: conversation.messages.reverse().map((m) => ({
      id: m.id,
      conversationId: id,
      role: m.role as "user" | "assistant",
      content: m.content,
      status: m.status,
      wamid: m.wamid,
      sentBy: m.sentBy,
      deliveredAt: m.deliveredAt?.toISOString() ?? null,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    messagesTotal: conversation._count.messages,
    messagesPage,
  }
}

export async function listAgentsWithStats(userId: string) {
  const agents = await prisma.agent.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      provider: true,
      _count: { select: { conversations: true } },
      conversations: {
        where: { mode: "human", unreadCount: { gt: 0 } },
        select: { id: true },
      },
    },
  })

  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    phoneNumber: a.phoneNumber,
    provider: a.provider,
    conversationCount: a._count.conversations,
    attentionCount: a.conversations.length,
  }))
}
