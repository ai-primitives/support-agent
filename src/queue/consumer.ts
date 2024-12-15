import { Ai, Queue, VectorizeIndex } from '@cloudflare/workers-types'
import { QueueMessage, ProcessedMessage, QueueError } from './types'
import { generateResponse } from '../worker'

export interface Env {
  SUPPORT_QUEUE: Queue<QueueMessage>
  DLQ: Queue<QueueError>
  SUPPORT_AI: Ai
  SUPPORT_VECTORIZE: VectorizeIndex
}

export interface MessageBatch<T> {
  messages: {
    body: T
    ack: () => void
    retry: () => void
    retryCount?: number
  }[]
}

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    const errors: QueueError[] = []

    for (const message of batch.messages) {
      try {
        const { businessId, persona, content } = message.body

        // Process message based on type
        switch (message.body.type) {
          case 'email':
            await handleEmailMessage(message.body, env)
            break
          case 'slack':
            await handleSlackMessage(message.body, env)
            break
          case 'chat':
            await handleChatMessage(message.body, env)
            break
          default:
            throw new Error(`Unknown message type: ${message.body.type}`)
        }

        message.ack()
      } catch (error) {
        console.error('Failed to process message:', error)

        // Add to DLQ with retry count
        const retryCount = (message.retryCount || 0) + 1
        const queueError: QueueError = {
          message: message.body,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
          retryCount
        }

        errors.push(queueError)
        message.retry()
      }
    }

    // Send failed messages to DLQ
    if (errors.length > 0) {
      await env.DLQ.sendBatch(
        errors.map(error => ({
          body: error,
          timestamp: error.timestamp
        }))
      )
    }
  }
}

async function handleEmailMessage(message: QueueMessage, env: Env) {
  // Generate response using RAG
  const response = await generateResponse(
    env.SUPPORT_VECTORIZE,
    env.SUPPORT_AI,
    message.content,
    message.businessId,
    message.persona
  )

  // TODO: Implement email sending logic
  console.log('Processing email message:', {
    response,
    metadata: message.metadata
  })
}

async function handleSlackMessage(message: QueueMessage, env: Env) {
  // Generate response using RAG
  const response = await generateResponse(
    env.SUPPORT_VECTORIZE,
    env.SUPPORT_AI,
    message.content,
    message.businessId,
    message.persona
  )

  // TODO: Implement Slack API integration
  console.log('Processing Slack message:', {
    response,
    channelId: message.metadata.channelId,
    threadId: message.metadata.threadId
  })
}

async function handleChatMessage(message: QueueMessage, env: Env) {
  // Generate response using RAG
  const response = await generateResponse(
    env.SUPPORT_VECTORIZE,
    env.SUPPORT_AI,
    message.content,
    message.businessId,
    message.persona
  )

  // TODO: Implement WebSocket or SSE for real-time chat
  console.log('Processing chat message:', {
    response,
    userId: message.metadata.userId
  })
}
