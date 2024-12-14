import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { cors } from 'hono/cors'
import { handle } from './handlers'
import type { Env } from './bindings'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors())

app.post('/api/businesses', handle.createBusiness)
app.post('/api/businesses/:id/personas', handle.createPersona)
app.post('/api/businesses/:id/knowledge', handle.addKnowledge)
app.get('/api/businesses/:id/knowledge/search', handle.searchKnowledge)

app.get('/', (c) => c.json({ message: 'Support Agent API' }))

export default app
