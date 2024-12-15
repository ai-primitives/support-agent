import { Env } from '../bindings'
import { QueueMessage } from '../queue/types'
import { RAGService } from '../services/rag'

export async function handleChat(message: QueueMessage, env: Env): Promise<void> {
  try {
    // Extract content from chat message
    const { businessId, persona, content, metadata } = message

    // Process query through RAG service
    const rag = new RAGService(env)
    const response = await rag.generateResponse(content, businessId, persona)

    // Prepare chat response
    const replyMessage: QueueMessage = {
      type: 'chat',
      businessId,
      persona,
      content: response,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    }

    // In local mode, just log the response
    if (env.LOCAL_MODE) {
      console.log('Chat Response:', replyMessage)
      return
    }

    // In production, send through Cloudflare Queue
    await env.MESSAGE_QUEUE.send(replyMessage)

  } catch (error) {
    console.error('Error handling chat message:', error)
    throw error
  }
}
