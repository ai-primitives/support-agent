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

export interface MessagePayload {
  type: 'email' | 'slack' | 'chat'
  businessId: string
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
}
