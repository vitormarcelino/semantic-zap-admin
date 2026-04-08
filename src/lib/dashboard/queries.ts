import { prisma } from "@/lib/prisma"
import type { Period } from "./period"
import type { PeriodRange } from "./period"

// PostgreSQL returns BigInt for COUNT — convert to Number
function toNum(val: unknown): number {
  if (typeof val === "bigint") return Number(val)
  if (typeof val === "string") return parseInt(val, 10)
  if (typeof val === "number") return val
  return 0
}

export interface KpiCounts {
  totalConversations: number
  activeConversations: number
  botHandled: number
  humanTakeovers: number
}

async function countKpis(
  userId: string,
  from: Date,
  to: Date
): Promise<KpiCounts> {
  const [totalConvRows, activeConvRows, botRows, takeoversRows] =
    await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT m."conversationId") as count
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND m."createdAt" BETWEEN ${from} AND ${to}
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "Conversation" c
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND c.status = 'active'
          AND c."lastMessageAt" BETWEEN ${from} AND ${to}
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND m."createdAt" BETWEEN ${from} AND ${to}
          AND m.role = 'assistant'
          AND (m."sentBy" = 'bot' OR m."sentBy" IS NULL)
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT m."conversationId") as count
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND m."createdAt" BETWEEN ${from} AND ${to}
          AND m."sentBy" LIKE 'operator:%'
      `,
    ])

  return {
    totalConversations: toNum(totalConvRows[0]?.count),
    activeConversations: toNum(activeConvRows[0]?.count),
    botHandled: toNum(botRows[0]?.count),
    humanTakeovers: toNum(takeoversRows[0]?.count),
  }
}

export interface ChartDataPoint {
  date: string
  incoming: number
  outgoing: number
}

export interface ConvPerDayPoint {
  date: string
  count: number
}

export interface BotVsHuman {
  bot: number
  human: number
  botPercent: number
  humanPercent: number
}

async function getCharts(
  userId: string,
  period: Period,
  from: Date,
  to: Date
): Promise<{
  messageVolume: ChartDataPoint[]
  conversationsPerDay: ConvPerDayPoint[]
  botVsHuman: BotVsHuman
}> {
  if (period === "today") {
    const [hourRows, convRows, botHumanRows] = await Promise.all([
      prisma.$queryRaw<
        Array<{ hour: number; incoming: bigint; outgoing: bigint }>
      >`
        SELECT
          EXTRACT(HOUR FROM m."createdAt")::int as hour,
          SUM(CASE WHEN m.role = 'user' THEN 1 ELSE 0 END) as incoming,
          SUM(CASE WHEN m.role = 'assistant' THEN 1 ELSE 0 END) as outgoing
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND m."createdAt" BETWEEN ${from} AND ${to}
        GROUP BY EXTRACT(HOUR FROM m."createdAt")
        ORDER BY hour ASC
      `,
      prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
        SELECT
          EXTRACT(HOUR FROM m."createdAt")::int as hour,
          COUNT(DISTINCT m."conversationId") as count
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND m."createdAt" BETWEEN ${from} AND ${to}
        GROUP BY EXTRACT(HOUR FROM m."createdAt")
        ORDER BY hour ASC
      `,
      prisma.$queryRaw<Array<{ bot: bigint; human: bigint }>>`
        SELECT
          SUM(CASE WHEN m."sentBy" = 'bot' OR m."sentBy" IS NULL THEN 1 ELSE 0 END) as bot,
          SUM(CASE WHEN m."sentBy" LIKE 'operator:%' THEN 1 ELSE 0 END) as human
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m."conversationId"
        JOIN "Agent" a ON a.id = c."agentId"
        WHERE a."userId" = ${userId}
          AND m."createdAt" BETWEEN ${from} AND ${to}
          AND m.role = 'assistant'
      `,
    ])

    const messageVolume: ChartDataPoint[] = hourRows.map((r) => ({
      date: `${r.hour}h`,
      incoming: toNum(r.incoming),
      outgoing: toNum(r.outgoing),
    }))

    const conversationsPerDay: ConvPerDayPoint[] = convRows.map((r) => ({
      date: `${r.hour}h`,
      count: toNum(r.count),
    }))

    const bot = toNum(botHumanRows[0]?.bot)
    const human = toNum(botHumanRows[0]?.human)
    const total = bot + human
    const botVsHuman: BotVsHuman = {
      bot,
      human,
      botPercent: total > 0 ? Math.round((bot / total) * 100) : 0,
      humanPercent: total > 0 ? Math.round((human / total) * 100) : 0,
    }

    return { messageVolume, conversationsPerDay, botVsHuman }
  }

  // 7d / 30d — group by date
  const [msgRows, convRows, botHumanRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{ date: string; incoming: bigint; outgoing: bigint }>
    >`
      SELECT
        TO_CHAR(DATE(m."createdAt"), 'YYYY-MM-DD') as date,
        SUM(CASE WHEN m.role = 'user' THEN 1 ELSE 0 END) as incoming,
        SUM(CASE WHEN m.role = 'assistant' THEN 1 ELSE 0 END) as outgoing
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      JOIN "Agent" a ON a.id = c."agentId"
      WHERE a."userId" = ${userId}
        AND m."createdAt" BETWEEN ${from} AND ${to}
      GROUP BY DATE(m."createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        TO_CHAR(DATE(m."createdAt"), 'YYYY-MM-DD') as date,
        COUNT(DISTINCT m."conversationId") as count
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      JOIN "Agent" a ON a.id = c."agentId"
      WHERE a."userId" = ${userId}
        AND m."createdAt" BETWEEN ${from} AND ${to}
      GROUP BY DATE(m."createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<Array<{ bot: bigint; human: bigint }>>`
      SELECT
        SUM(CASE WHEN m."sentBy" = 'bot' OR m."sentBy" IS NULL THEN 1 ELSE 0 END) as bot,
        SUM(CASE WHEN m."sentBy" LIKE 'operator:%' THEN 1 ELSE 0 END) as human
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      JOIN "Agent" a ON a.id = c."agentId"
      WHERE a."userId" = ${userId}
        AND m."createdAt" BETWEEN ${from} AND ${to}
        AND m.role = 'assistant'
    `,
  ])

  const messageVolume: ChartDataPoint[] = msgRows.map((r) => ({
    date: r.date,
    incoming: toNum(r.incoming),
    outgoing: toNum(r.outgoing),
  }))

  const conversationsPerDay: ConvPerDayPoint[] = convRows.map((r) => ({
    date: r.date,
    count: toNum(r.count),
  }))

  const bot = toNum(botHumanRows[0]?.bot)
  const human = toNum(botHumanRows[0]?.human)
  const total = bot + human
  const botVsHuman: BotVsHuman = {
    bot,
    human,
    botPercent: total > 0 ? Math.round((bot / total) * 100) : 0,
    humanPercent: total > 0 ? Math.round((human / total) * 100) : 0,
  }

  return { messageVolume, conversationsPerDay, botVsHuman }
}

export interface RecentActivityItem {
  messageId: string
  conversationId: string
  agentId: string
  agentName: string
  phoneNumber: string
  role: "user" | "assistant"
  content: string
  sentBy: string | null
  createdAt: string
}

async function getRecentActivity(userId: string): Promise<RecentActivityItem[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      conversationId: string
      role: string
      content: string
      createdAt: Date
      sentBy: string | null
      agentId: string
      phoneNumber: string
      agentName: string
    }>
  >`
    SELECT
      m.id,
      m."conversationId",
      m.role,
      m.content,
      m."createdAt",
      m."sentBy",
      c."agentId",
      c."phoneNumber",
      a.name as "agentName"
    FROM "Message" m
    JOIN "Conversation" c ON c.id = m."conversationId"
    JOIN "Agent" a ON a.id = c."agentId"
    WHERE a."userId" = ${userId}
    ORDER BY m."createdAt" DESC
    LIMIT 10
  `

  return rows.map((r) => ({
    messageId: r.id,
    conversationId: r.conversationId,
    agentId: r.agentId,
    agentName: r.agentName,
    phoneNumber: r.phoneNumber,
    role: r.role as "user" | "assistant",
    content: r.content,
    sentBy: r.sentBy,
    createdAt: r.createdAt.toISOString(),
  }))
}

export interface DashboardSummary {
  period: Period
  range: { from: string; to: string }
  kpis: KpiCounts & {
    trends: {
      totalConversations: number | "new"
      activeConversations: number | "new"
      botHandled: number | "new"
      humanTakeovers: number | "new"
    }
  }
  charts: {
    messageVolume: ChartDataPoint[]
    conversationsPerDay: ConvPerDayPoint[]
    botVsHuman: BotVsHuman
  }
  recentActivity: RecentActivityItem[]
}

function computeTrend(
  current: number,
  previous: number
): number | "new" {
  if (previous === 0) return current > 0 ? "new" : 0
  return (current - previous) / previous
}

export async function getDashboardSummary(
  userId: string,
  period: Period,
  range: PeriodRange
): Promise<DashboardSummary> {
  const { from, to, previousFrom, previousTo } = range

  const [current, previous, charts, recentActivity] = await Promise.all([
    countKpis(userId, from, to),
    countKpis(userId, previousFrom, previousTo),
    getCharts(userId, period, from, to),
    getRecentActivity(userId),
  ])

  return {
    period,
    range: { from: from.toISOString(), to: to.toISOString() },
    kpis: {
      ...current,
      trends: {
        totalConversations: computeTrend(
          current.totalConversations,
          previous.totalConversations
        ),
        activeConversations: computeTrend(
          current.activeConversations,
          previous.activeConversations
        ),
        botHandled: computeTrend(current.botHandled, previous.botHandled),
        humanTakeovers: computeTrend(
          current.humanTakeovers,
          previous.humanTakeovers
        ),
      },
    },
    charts,
    recentActivity,
  }
}

export interface AgentMetrics {
  id: string
  name: string
  model: string
  tone: string
  phoneNumber: string | null
  isActive: boolean
  metrics: {
    conversations: number
    messages: number
    takeovers: number
    avgResponseTimeSeconds: number | null
    attentionCount: number
  }
}

export async function getDashboardAgents(
  userId: string,
  from: Date,
  to: Date
): Promise<AgentMetrics[]> {
  const now = new Date()
  const activeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [agentRows, avgRows, attentionRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: string
        name: string
        model: string
        tone: string
        phoneNumber: string | null
        conversations: bigint
        messages: bigint
        takeovers: bigint
        last_message_at: Date | null
      }>
    >`
      SELECT
        a.id,
        a.name,
        a.model,
        a.tone,
        a."phoneNumber",
        COUNT(DISTINCT m."conversationId") as conversations,
        COUNT(m.id) as messages,
        COUNT(DISTINCT CASE WHEN m."sentBy" LIKE 'operator:%' THEN m."conversationId" END) as takeovers,
        MAX(m."createdAt") as last_message_at
      FROM "Agent" a
      LEFT JOIN "Conversation" c ON c."agentId" = a.id
      LEFT JOIN "Message" m ON m."conversationId" = c.id
        AND m."createdAt" BETWEEN ${from} AND ${to}
      WHERE a."userId" = ${userId}
      GROUP BY a.id, a.name, a.model, a.tone, a."phoneNumber"
      ORDER BY conversations DESC
    `,
    prisma.$queryRaw<Array<{ agentId: string; avg_seconds: number | null }>>`
      SELECT
        c."agentId",
        AVG(EXTRACT(EPOCH FROM (m2."createdAt" - m1."createdAt"))) as avg_seconds
      FROM "Message" m1
      JOIN "Conversation" c ON c.id = m1."conversationId"
      JOIN "Agent" a ON a.id = c."agentId"
      JOIN LATERAL (
        SELECT "createdAt" FROM "Message"
        WHERE "conversationId" = m1."conversationId"
          AND role = 'assistant'
          AND ("sentBy" = 'bot' OR "sentBy" IS NULL)
          AND "createdAt" > m1."createdAt"
        ORDER BY "createdAt" ASC
        LIMIT 1
      ) m2 ON true
      WHERE a."userId" = ${userId}
        AND m1.role = 'user'
        AND m1."createdAt" BETWEEN ${from} AND ${to}
      GROUP BY c."agentId"
    `,
    prisma.$queryRaw<Array<{ agentId: string; attention_count: bigint }>>`
      SELECT c."agentId", COUNT(*) as attention_count
      FROM "Conversation" c
      JOIN "Agent" a ON a.id = c."agentId"
      WHERE a."userId" = ${userId}
        AND c.mode = 'human'
        AND c."unreadCount" > 0
      GROUP BY c."agentId"
    `,
  ])

  const avgByAgent = new Map(avgRows.map((r) => [r.agentId, r.avg_seconds]))
  const attentionByAgent = new Map(
    attentionRows.map((r) => [r.agentId, toNum(r.attention_count)])
  )

  return agentRows.map((r) => ({
    id: r.id,
    name: r.name,
    model: r.model,
    tone: r.tone,
    phoneNumber: r.phoneNumber,
    isActive:
      r.last_message_at !== null && r.last_message_at > activeThreshold,
    metrics: {
      conversations: toNum(r.conversations),
      messages: toNum(r.messages),
      takeovers: toNum(r.takeovers),
      avgResponseTimeSeconds: avgByAgent.get(r.id) ?? null,
      attentionCount: attentionByAgent.get(r.id) ?? 0,
    },
  }))
}
