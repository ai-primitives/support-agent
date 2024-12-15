import { Hono } from 'hono'
import { businessRoutes } from './api/business'
import { personaRoutes } from './api/persona'
import { knowledgeBaseRoutes } from './api/knowledge-base'
import setupRoutes from './api/setup'
import { createMessageConsumer } from './queues/consumer'
import type { MessageBatch } from './queues/types'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

// Add middleware for error handling
app.onError((err, c) => {
  console.error(`Error: ${err.message}`)
  return c.json({
    error: err.message,
    stack: c.env.ENVIRONMENT === 'development' ? err.stack : undefined
  }, 500)
})

// Add routes
app.route('/api/business', businessRoutes)
app.route('/api/persona', personaRoutes)
app.route('/api/knowledge-base', knowledgeBaseRoutes)
app.route('/api/setup', setupRoutes)

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }))

export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch, env: Env) => {
    const consumer = createMessageConsumer(env)
    await consumer.processMessage(batch)
  }
}
