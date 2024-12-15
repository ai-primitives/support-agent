import { VectorSearchResult, AiResponse } from '../types'

interface BaseMetadata {
  timestamp: number
  channelId?: string
  threadId?: string
  userId?: string
}

interface EmailMetadata extends BaseMetadata {
  subject?: string
  from?: string
  to?: string[]
  html?: string
}

interface SlackMetadata extends BaseMetadata {
  channel?: string
  thread_ts?: string
  user?: string
}

interface ChatMetadata extends BaseMetadata {
  sessionId?: string
}

export interface QueueMessage {
  type: 'email' | 'slack' | 'chat'
  businessId: string
  persona: string
  content: string
  metadata: EmailMetadata | SlackMetadata | ChatMetadata
}

export interface ProcessedMessage {
  message: QueueMessage
  response: AiResponse
  context?: VectorSearchResult[]
}

export interface QueueError {
  message: QueueMessage
  error: string
  timestamp: number
  retryCount: number
}
