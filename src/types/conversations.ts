export type ConversationMode = "bot" | "human"

export type MessageStatus = "pending" | "processing" | "sent" | "delivered" | "read" | "failed"

export interface MessageRecord {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  status: MessageStatus
  wamid: string | null
  sentBy: string | null // "bot" | "operator:{userId}" | null
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
}

export interface ConversationSummary {
  id: string
  agentId: string
  agentName: string
  phoneNumber: string
  mode: ConversationMode
  status: string
  unreadCount: number
  lastMessageAt: string
  lastMessage: {
    content: string
    role: "user" | "assistant"
    status: MessageStatus
  } | null
}

export interface ConversationDetail {
  id: string
  agentId: string
  agentName: string
  phoneNumber: string
  mode: ConversationMode
  assignedTo: string | null
  messages: MessageRecord[]
  messagesTotal: number
  messagesPage: number
}

export interface AgentSummary {
  id: string
  name: string
  phoneNumber: string | null
  provider: string | null
  conversationCount: number
  attentionCount: number // human mode + unreadCount > 0
}

// SSE event types
export type SSEEventType =
  | "connected"
  | "new_message"
  | "mode_changed"
  | "message_status"
  | "conversation_updated"
  | "subscription_updated"

export interface SSEEvent {
  type: SSEEventType
  conversationId?: string
  payload?: Record<string, unknown>
}

export interface ConversationFilters {
  agentId: string
  page?: number
  limit?: number
  mode?: ConversationMode
  search?: string
}
