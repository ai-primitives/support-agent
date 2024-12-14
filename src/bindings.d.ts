/// <reference types="@cloudflare/workers-types" />

interface MessagePayload {
  type: 'email' | 'slack' | 'chat' | 'knowledge_processed' | 'knowledge_error'
  businessId: string
  conversationId?: string
  content?: string
  status?: 'success' | 'error'
  error?: string
  metadata?: Record<string, unknown>
}

interface KnowledgeWorkflowPayload {
  businessId: string
  content: string
  metadata?: Record<string, unknown>
}

export interface Env {
  CHAT_SESSIONS: DurableObjectNamespace
  VECTORIZE: {
    query(query: { topK: number; vector: number[] }): Promise<any>
    insert(vectors: { id: string; values: number[]; metadata: any }[]): Promise<void>
    upsert(vectors: { id: string; values: number[]; metadata: any }[]): Promise<void>
  }
  AI: {
    run(model: string, inputs: { text: string }): Promise<number[]>
  }
  MESSAGE_QUEUE: Queue<MessagePayload>
  KNOWLEDGE_WORKFLOW: WorkflowNamespace
}
