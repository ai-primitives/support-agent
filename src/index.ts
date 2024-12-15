import { Hono } from 'hono'
import { businessRoutes } from './api/business.js'
import { personaRoutes } from './api/persona.js'
import { knowledgeBaseRoutes } from './api/knowledge-base.js'
import { handle } from './handlers'
import type { Env } from './types'
import { ChatSession } from './durable_objects/chat_session'
import { KnowledgeWorkflow } from './workflows/knowledge'

const app = new Hono<{ Bindings: Env }>()

// Add middleware for error handling
app.onError((err: Error, c: { json: (data: any, status?: number) => any, env: Env }) => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    console.error(`Error: ${err.message}`)
  }
  return c.json({
    error: err.message,
    stack: c.env.ENVIRONMENT === 'development' ? err.stack : undefined
  }, 500)
})

// Add routes
app.route('/api/business', businessRoutes)
app.route('/api/persona', personaRoutes)
app.route('/api/knowledge-base', knowledgeBaseRoutes)

// Legacy routes (to be migrated)
app.post('/api/businesses/:id/conversations/:conversationId/messages', handle.sendMessage)
app.post('/api/businesses/:id/workflows/knowledge', handle.triggerKnowledgeWorkflow)

// Health check endpoint
app.get('/health', (c: { json: (data: any) => any }) => c.json({ status: 'ok' }))

export default {
  fetch: app.fetch
}
export { ChatSession }
export { KnowledgeWorkflow }
