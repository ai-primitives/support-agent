import { RAGService } from '../services/rag'
import type { Env } from '../bindings'
import type { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from '../types/workflow'

interface KnowledgePayload {
  businessId: string
  content: string
  metadata?: Record<string, unknown>
}

export default class KnowledgeWorkflow implements WorkflowEntrypoint<Env> {
  constructor(public env: Env) {}

  async run(event: WorkflowEvent<KnowledgePayload>, step: WorkflowStep) {
    const { businessId, content, metadata } = event.payload

    // Validate input
    if (!content.trim()) {
      throw new Error('Content cannot be empty')
    }

    // Process knowledge using RAG service
    await step.do('process_knowledge', async () => {
      const rag = new RAGService(this.env)
      const id = crypto.randomUUID()

      try {
        await rag.addKnowledge({
          id,
          businessId,
          content,
          metadata
        })
        console.log(`[Workflow] Added knowledge entry ${id} for business ${businessId}`)
      } catch (error) {
        console.error(`[Workflow] Failed to add knowledge: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    })

    // Queue message for notification
    await step.do('notify', async () => {
      try {
        await this.env.MESSAGE_QUEUE.send({
          type: 'chat',
          businessId,
          conversationId: 'system',
          content: 'New knowledge base entry added',
          metadata: {
            event: 'knowledge_added',
            businessId,
            timestamp: new Date().toISOString()
          }
        })
        console.log(`[Workflow] Sent notification for business ${businessId}`)
      } catch (error) {
        console.error(`[Workflow] Failed to send notification: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    })
  }
}
