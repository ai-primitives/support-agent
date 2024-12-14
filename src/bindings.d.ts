/// <reference types="@cloudflare/workers-types" />

interface MessagePayload {
  type: 'email' | 'slack' | 'chat'
  businessId: string
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
}

interface KnowledgeWorkflowPayload {
  businessId: string
  content: string
  metadata?: Record<string, unknown>
}

export interface Env {
  CHAT_SESSIONS: DurableObjectNamespace
  VECTORIZE: any // Will be properly typed in next step
  AI: any // Will be properly typed in next step
  MESSAGE_QUEUE: Queue<MessagePayload>
  KNOWLEDGE_WORKFLOW: WorkflowNamespace<KnowledgeWorkflowPayload>
}
