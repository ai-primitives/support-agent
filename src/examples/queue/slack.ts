import { Bindings } from '../../types'
import { QueueMessage } from '../../queue/types'

/**
 * Slack queue example demonstrating message processing for Slack channel
 */
export const slackQueueExample = async (env: Pick<Bindings, 'SUPPORT_QUEUE'>) => {
  // Example 1: Direct message
  const directMessage: QueueMessage = {
    type: 'slack',
    businessId: 'business1',
    persona: 'support',
    content: 'How do I upgrade my plan?',
    metadata: {
      channelId: 'D123456',
      threadId: undefined,
      userId: 'U789012',
      timestamp: Date.now()
    }
  }
  await env.SUPPORT_QUEUE.send(directMessage)

  // Example 2: Channel thread
  const threadMessage: QueueMessage = {
    type: 'slack',
    businessId: 'business1',
    persona: 'sales',
    content: 'Interested in enterprise features',
    metadata: {
      channelId: 'C345678',
      threadId: 'T901234',
      userId: 'U789012',
      timestamp: Date.now()
    }
  }
  await env.SUPPORT_QUEUE.send(threadMessage)

  return { directMessage, threadMessage }
}
