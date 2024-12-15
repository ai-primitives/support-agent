/// <reference types="@cloudflare/workers-types" />

import { VectorizeIndex, D1Database } from '@cloudflare/workers-types'
import { Ai } from '@cloudflare/workers-types'
import { Queue } from '@cloudflare/workers-types'
import { QueueMessage, QueueError } from './queue/types'

export interface Env {
  DB: D1Database
  VECTORIZE_INDEX: VectorizeIndex
  ENVIRONMENT: string
  AI: Ai
  MESSAGE_QUEUE: Queue<QueueMessage>
  DLQ: Queue<QueueError>
  CHAT_SESSIONS: DurableObjectNamespace
  KNOWLEDGE_WORKFLOW: WorkflowNamespace
  LOCAL_MODE?: boolean
}
