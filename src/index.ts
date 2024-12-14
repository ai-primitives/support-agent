import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { chatRouter } from './routes/chat'

const app = new Hono()

// Enable CORS
app.use('*', cors())

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }))

// Mount chat routes
app.route('/api/chat', chatRouter)

export default {
  fetch: app.fetch
}
