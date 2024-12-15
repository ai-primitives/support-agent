import { VectorizeIndex, D1Database } from '@cloudflare/workers-types'
import { Ai } from '@cloudflare/workers-types'
import { Queue } from '@cloudflare/workers-types'
import { QueueMessage, ProcessedMessage, QueueError } from './queue/types'

export interface Env {
  DB: D1Database
  VECTORIZE_INDEX: VectorizeIndex
  ENVIRONMENT: string
  AI: Ai
  MESSAGE_QUEUE: Queue<QueueMessage>
  DLQ: Queue<QueueError>
}

export interface BusinessProfile {
  id: string
  name: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CustomerPersona {
  id: string
  business_id: string
  name: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface KnowledgeBaseEntry {
  id: string
  business_id: string
  content: string
  metadata: Record<string, unknown>
  embedding_id: string | null
  created_at: string
  updated_at: string
}

export interface VectorSearchResult {
  id: string
  score: number
  metadata: {
    content: string
    business_id: string
    persona: string
    [key: string]: unknown
  }
}

export interface AiResponse {
  text: string
  metadata?: {
    business_id: string
    persona: string
    context_used: string[]
  }
}
