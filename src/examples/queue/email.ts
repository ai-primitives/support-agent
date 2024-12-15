import { Bindings } from '../../types'
import { QueueMessage } from '../../queue/types'

/**
 * Email queue example demonstrating message processing for email channel
 */
export const emailQueueExample = async (env: Pick<Bindings, 'SUPPORT_QUEUE'>) => {
  // Example 1: Basic email message
  const basicEmail: QueueMessage = {
    type: 'email',
    businessId: 'business1',
    persona: 'support',
    content: 'Need help with login issues',
    metadata: {
      threadId: 'thread123',
      userId: 'user456',
      timestamp: Date.now()
    }
  }
  await env.SUPPORT_QUEUE.send(basicEmail)

  // Example 2: Email with context
  const threadedEmail: QueueMessage = {
    type: 'email',
    businessId: 'business1',
    persona: 'support',
    content: 'Re: Previous login issue - still not resolved',
    metadata: {
      threadId: 'thread123',
      userId: 'user456',
      timestamp: Date.now()
    }
  }
  await env.SUPPORT_QUEUE.send(threadedEmail)

  return { basicEmail, threadedEmail }
}
