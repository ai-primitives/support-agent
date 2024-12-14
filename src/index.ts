import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { handle } from './handlers'
import type { Env } from './bindings'
import { ChatSession } from './durable_objects/chat_session'
import { runTests } from './dev/test'
import { KNOWLEDGE_WORKFLOW } from './workflows/knowledge'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

app.post('/api/businesses', handle.createBusiness)
app.post('/api/businesses/:id/personas', handle.createPersona)
app.post('/api/businesses/:id/knowledge', handle.addKnowledge)
app.get('/api/businesses/:id/knowledge/search', handle.searchKnowledge)
app.post('/api/businesses/:id/conversations/:conversationId/messages', handle.sendMessage)
app.post('/api/businesses/:id/workflows/knowledge', handle.triggerKnowledgeWorkflow)

app.get('/', (c) => c.json({ message: 'Support Agent API' }))

// Development test endpoint
app.get('/test', async (c) => {
  await runTests(c.env)
  return c.json({ message: 'Tests completed' })
})

export default app
export { ChatSession }
export { KNOWLEDGE_WORKFLOW }
