import { VectorSearchResult, AiResponse } from '../types'

export interface QueueMessage {
  type: 'email' | 'slack' | 'chat'
  businessId: string
  persona: string
  content: string
  metadata: {
    channelId?: string
    threadId?: string
    userId?: string
    timestamp: number
  }
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
