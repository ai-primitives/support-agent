import { VectorizeIndex, VectorizeMatches, D1Database } from '@cloudflare/workers-types'
import { Ai } from '@cloudflare/workers-types'
import { Queue } from '@cloudflare/workers-types'
import { QueueMessage, ProcessedMessage, QueueError } from './queue/types'

export interface Bindings {
  SUPPORT_VECTORIZE: VectorizeIndex
  SUPPORT_AI: Ai
  DB: D1Database
  SUPPORT_QUEUE: Queue<QueueMessage>
  DLQ: Queue<QueueError>
}

export interface VectorSearchResult {
  id: string
  score: number
  metadata: {
    content: string
    business_id: string
    persona: string
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
