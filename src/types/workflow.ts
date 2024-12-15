/**
 * Custom type definitions for Cloudflare Workflows
 * Based on https://developers.cloudflare.com/workflows/build/workers-api/
 */

export interface WorkflowEvent<T = unknown> {
  payload: T
  timestamp: string
  workflowId: string
  stepId?: string
}

export interface WorkflowStep {
  do(name: string, fn: () => Promise<void>): Promise<void>
  waitFor(name: string): Promise<void>
}

export interface WorkflowEntrypoint<E = unknown> {
  env: E
  run(event: WorkflowEvent, step: WorkflowStep): Promise<void>
}

export interface EmailMessage {
  from: string
  to: string[]
  subject: string
  text: string
  html?: string
  metadata?: Record<string, unknown>
}

export interface MessagePayload {
  type: 'email' | 'slack' | 'chat' | 'knowledge_processed' | 'knowledge_error'
  businessId: string
  conversationId?: string
  content?: string
  email?: {
    from: string
    to: string[]
    subject: string
    text: string
    html?: string
  }
  status?: 'success' | 'error'
  error?: string
  metadata?: Record<string, unknown>
}
