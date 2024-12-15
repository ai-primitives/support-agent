import { Hono } from 'hono'
import { businessRoutes } from './api/business.js'
import { personaRoutes } from './api/persona.js'
import { knowledgeBaseRoutes } from './api/knowledge-base.js'
import setupRoutes from './api/setup.js'
import type { Env } from './types.js'

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
  fetch: app.fetch
}
