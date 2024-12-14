/// <reference types="@cloudflare/workers-types" />

export interface Env {
  CHAT_SESSIONS: DurableObjectNamespace
  VECTORIZE: any // Will be properly typed in next step
  AI: any // Will be properly typed in next step
  MESSAGE_QUEUE: Queue<unknown>
  KNOWLEDGE_WORKFLOW: any // Will be properly typed in next step
}
