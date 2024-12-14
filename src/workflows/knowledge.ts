import { RAGService } from '../services/rag'
import type { Env } from '../bindings'
import type { WorkflowEvent, WorkflowStep } from '../types/workflow'

interface KnowledgePayload {
  businessId: string
  content: string
  metadata?: Record<string, unknown>
}

export class KnowledgeWorkflow {
  constructor(private readonly env: Env) {}

  async run(event: WorkflowEvent<KnowledgePayload>, step: WorkflowStep) {
    const ragService = new RAGService(this.env)

    try {
      // Process knowledge entry using step.do
      await step.do('add_knowledge', async () => {
        await ragService.addKnowledge({
          id: crypto.randomUUID(),
          businessId: event.payload.businessId,
          content: event.payload.content,
          metadata: event.payload.metadata
        })
      })

      // Send notification via queue using step.do
      await step.do('send_notification', async () => {
        await this.env.MESSAGE_QUEUE.send({
          type: 'knowledge_processed',
          businessId: event.payload.businessId,
          status: 'success'
        })
      })
    } catch (error) {
      console.error('Error in knowledge workflow:', error)

      // Send error notification using step.do
      await step.do('send_error', async () => {
        await this.env.MESSAGE_QUEUE.send({
          type: 'knowledge_error',
          businessId: event.payload.businessId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      })

      throw error
    }
  }
}
