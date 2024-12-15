import { Hono } from 'hono'
import { Env } from '../types'

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  const schema = 'CREATE TABLE IF NOT EXISTS business_profiles (id TEXT PRIMARY KEY,name TEXT NOT NULL,config TEXT NOT NULL,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)'

  try {
    await c.env.DB.exec(schema)
    return c.json({ success: true })
  } catch (error) {
    console.error('Database initialization error:', error)
    return c.json({ error: 'Failed to initialize database' }, 500)
  }
})

export default app
