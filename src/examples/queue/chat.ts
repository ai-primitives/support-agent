import { Bindings } from '../../types'
import { QueueMessage } from '../../queue/types'

/**
 * Chat queue example demonstrating message processing for web chat channel
 */
export const chatQueueExample = async (env: Pick<Bindings, 'SUPPORT_QUEUE'>) => {
  // Example 1: New chat session
  const newChat: QueueMessage = {
    type: 'chat',
    businessId: 'business1',
    persona: 'support',
    content: 'Hello, I need help with API integration',
    metadata: {
      threadId: 'session789',
      userId: 'visitor123',
      timestamp: Date.now()
    }
  }
  await env.SUPPORT_QUEUE.send(newChat)

  // Example 2: Follow-up in chat session
  const followupChat: QueueMessage = {
    type: 'chat',
    businessId: 'business1',
    persona: 'support',
    content: 'Getting error 403 when calling the endpoint',
    metadata: {
      threadId: 'session789',
      userId: 'visitor123',
      timestamp: Date.now()
    }
  }
  await env.SUPPORT_QUEUE.send(followupChat)

  return { newChat, followupChat }
}
