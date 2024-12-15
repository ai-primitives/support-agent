import { Hono } from 'hono'
import { Bindings } from '../types'
import { QueueMessage } from './types'

const app = new Hono<{ Bindings: Bindings }>()

app.post('/api/message/email', async (c) => {
  const { businessId, persona, content, metadata } = await c.req.json()

  if (!businessId || !persona || !content) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  const message: QueueMessage = {
    type: 'email',
    businessId,
    persona,
    content,
    metadata: {
      ...metadata,
      timestamp: Date.now()
    }
  }

  try {
    await c.env.SUPPORT_QUEUE.send(message)
    return c.json({ status: 'Message queued successfully' })
  } catch (error) {
    console.error('Failed to queue email message:', error)
    return c.json({ error: 'Failed to queue message' }, 500)
  }
})

app.post('/api/message/slack', async (c) => {
  const { businessId, persona, content, metadata } = await c.req.json()

  if (!businessId || !persona || !content || !metadata?.channelId) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  const message: QueueMessage = {
    type: 'slack',
    businessId,
    persona,
    content,
    metadata: {
      ...metadata,
      timestamp: Date.now()
    }
  }

  try {
    await c.env.SUPPORT_QUEUE.send(message)
    return c.json({ status: 'Message queued successfully' })
  } catch (error) {
    console.error('Failed to queue slack message:', error)
    return c.json({ error: 'Failed to queue message' }, 500)
  }
})

app.post('/api/message/chat', async (c) => {
  const { businessId, persona, content, metadata } = await c.req.json()

  if (!businessId || !persona || !content || !metadata?.userId) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  const message: QueueMessage = {
    type: 'chat',
    businessId,
    persona,
    content,
    metadata: {
      ...metadata,
      timestamp: Date.now()
    }
  }

  try {
    await c.env.SUPPORT_QUEUE.send(message)
    return c.json({ status: 'Message queued successfully' })
  } catch (error) {
    console.error('Failed to queue chat message:', error)
    return c.json({ error: 'Failed to queue message' }, 500)
  }
})

export default app
