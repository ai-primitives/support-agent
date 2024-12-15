import { Env } from '../bindings'

interface MessagePayload {
  type: 'email' | 'slack' | 'chat'
  businessId: string
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
}

async function handleEmail(payload: MessagePayload, env: Env) {
  // Email handling will be implemented in a separate PR
  console.log('Handling email message:', payload)
}

async function handleSlack(payload: MessagePayload, env: Env) {
  // Slack handling will be implemented in a separate PR
  console.log('Handling slack message:', payload)
}

async function handleChat(payload: MessagePayload, env: Env) {
  // Get the chat session for this conversation
  const sessionId = `chat:${payload.conversationId}`
  const session = env.CHAT_SESSIONS.get(env.CHAT_SESSIONS.idFromName(sessionId))

  // Forward the message to the chat session
  await session.fetch('https://dummy-url/message', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export default {
  async queue(batch: MessageBatch<MessagePayload>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const payload = message.body

        switch (payload.type) {
          case 'email':
            await handleEmail(payload, env)
            break
          case 'slack':
            await handleSlack(payload, env)
            break
          case 'chat':
            await handleChat(payload, env)
            break
          default:
            console.error(`Unknown message type: ${(payload as any).type}`)
        }

        // Acknowledge successful processing
        message.ack()
      } catch (error) {
        console.error('Error processing message:', error)
        // Retry the message
        message.retry()
      }
    }
  }
}
