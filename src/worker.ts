import { Hono } from 'hono'
import { ChatSession } from './durable_objects/chat_session'
import { RAGService } from './services/rag'
import { MessageService } from './services/message'
import { handle } from './handlers'
import type { Env } from './bindings'

export { ChatSession }

const app = new Hono<{ Bindings: Env }>()

// Health check endpoint
app.get('/', (c) => c.text('Support Agent API'))

// API routes
app.post('/api/business', handle.createBusiness)
app.post('/api/business/:id/persona', handle.createPersona)
app.post('/api/business/:id/knowledge', handle.addKnowledge)
app.get('/api/business/:id/knowledge/search', handle.searchKnowledge)
app.post('/api/business/:id/conversation/:conversationId/message', handle.sendMessage)

// Chat session endpoints
app.get('/chat/:id', async (c) => {
  const id = c.req.param('id')
  const chatId = c.env.CHAT_SESSIONS.idFromName(id)
  const chat = c.env.CHAT_SESSIONS.get(chatId)
  return chat.fetch(c.req.raw)
})

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await handle.handleMessage(message.body, env)
        message.ack()
      } catch (error) {
        console.error('Error processing message:', error)
        message.retry()
      }
    }
  }
}
