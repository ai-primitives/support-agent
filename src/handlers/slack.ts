import { Env } from '../bindings'
import { RAGService } from '../services/rag'
import { QueueMessage } from '../queue/types'

export async function handleSlack(message: QueueMessage & { metadata: { channel?: string, thread_ts?: string, user?: string } }, env: Env): Promise<void> {
  try {
    // Extract content from Slack message
    const { businessId, persona, content, metadata } = message

    // Process query through RAG service
    const rag = new RAGService(env)
    const response = await rag.generateResponse(content, businessId, persona)

    // Prepare Slack response
    const replyMessage: QueueMessage = {
      type: 'slack',
      businessId,
      persona,
      content: response,
      metadata: {
        timestamp: Date.now(),
        channelId: metadata?.channel,
        threadId: metadata?.thread_ts,
        userId: metadata?.user,
        channel: metadata?.channel,
        thread_ts: metadata?.thread_ts,
        user: metadata?.user
      }
    }

    // In local mode, just log the response
    if (env.LOCAL_MODE) {
      console.log('Slack Response:', replyMessage)
      return
    }

    // In production, send through Cloudflare Queue
    await env.MESSAGE_QUEUE.send(replyMessage)

  } catch (error) {
    console.error('Error handling Slack message:', error)
    throw error
  }
}
