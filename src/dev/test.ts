import { Hono } from 'hono'
import { Env } from '../bindings'
import { handleEmail } from '../handlers/email'
import { MessagePayload, EmailMessage } from '../types/workflow'
import { ChatSession } from '../durable_objects/chat_session'
import { KnowledgeWorkflow } from '../workflows/knowledge'

const app = new Hono<{ Bindings: Env }>()

// Test Workers AI
app.post('/test/workers-ai', async (c) => {
  const { text } = await c.req.json()
  try {
    const embedding = await c.env.AI.run('@cf/bge-small-en-v1.5', { text })
    return c.json({ success: true, embedding: embedding.data[0] })
  } catch (error) {
    console.error('Workers AI Error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Test Vectorize
app.post('/test/vectorize', async (c) => {
  const { text } = await c.req.json()
  try {
    const embedding = await c.env.AI.run('@cf/bge-small-en-v1.5', { text })
    const id = crypto.randomUUID()

    await c.env.VECTORIZE.upsert([{
      id,
      values: embedding.data[0],
      metadata: { content: text }
    }])

    const results = await c.env.VECTORIZE.query(embedding.data[0], {
      topK: 1,
      filter: {},
      returnMetadata: true
    })

    return c.json({ success: true, results })
  } catch (error) {
    console.error('Vectorize Error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Test Queue
app.post('/test/queue', async (c) => {
  try {
    const emailMessage: EmailMessage = {
      from: 'test@example.com',
      to: ['support@test-business.com'],
      subject: 'Test Email',
      text: 'How do I reset my password?'
    }

    const message: MessagePayload = {
      type: 'email',
      businessId: 'test-business',
      conversationId: crypto.randomUUID(),
      email: emailMessage
    }

    await c.env.MESSAGE_QUEUE.send(message)
    return c.json({ success: true, message: 'Message queued successfully' })
  } catch (error) {
    console.error('Queue Error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Test Email Handler
app.post('/test/email', async (c) => {
  try {
    const testEmail: EmailMessage = {
      from: 'test@example.com',
      to: ['support@test-business.com'],
      subject: 'Password Reset',
      text: 'How do I reset my password?'
    }
    const response = await handleEmail(testEmail, c.env)
    return c.json({ success: true, response })
  } catch (error) {
    console.error('Email Handler Error:', error)
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

export { ChatSession, KnowledgeWorkflow }
export default app
