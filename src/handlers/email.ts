import { Env } from '../bindings'
import { RAGService } from '../services/rag'
import { QueueMessage } from '../queue/types'

export async function handleEmail(message: QueueMessage & { metadata: { from?: string, to?: string[], subject?: string } }, env: Env): Promise<void> {
  try {
    // Extract content from email
    const { businessId, persona, content, metadata } = message

    // Process query through RAG service
    const rag = new RAGService(env)
    const response = await rag.generateResponse(content, businessId, persona)

    // Prepare email response
    const replyEmail: QueueMessage = {
      type: 'email',
      businessId,
      persona,
      content: response,
      metadata: {
        timestamp: Date.now(),
        channelId: metadata?.channelId,
        threadId: metadata?.threadId,
        userId: metadata?.userId,
        subject: `Re: ${metadata?.subject || 'Support Request'}`,
        from: metadata?.to?.[0] || 'support@example.com',
        to: [metadata?.from || ''],
        html: `<div>${response.replace(/\n/g, '<br/>')}</div>`
      }
    }

    // In local mode, just log the response
    if (env.LOCAL_MODE) {
      console.log('Email Response:', replyEmail)
      return
    }

    // In production, send through Cloudflare Queue
    await env.MESSAGE_QUEUE.send(replyEmail)

  } catch (error) {
    console.error('Error handling email:', error)
    throw error
  }
}
