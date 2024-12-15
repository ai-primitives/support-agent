import { Hono } from 'hono'
import { Env } from '../bindings'
import { handleEmail } from '../handlers/email'
import { MessagePayload, EmailMessage } from '../types/workflow'
import { ChatSession } from '../durable_objects/chat_session'
import { KnowledgeWorkflow } from '../workflows/knowledge'

const app = new Hono<{ Bindings: Env }>()

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

// Test Workers AI
app.post('/test/workers-ai', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.text || typeof body.text !== 'string') {
      return c.json({ error: 'Invalid input: text field is required and must be a string' }, 400)
    }

    console.log('Testing Workers AI with text:', body.text)
    const startTime = Date.now()

    const embedding = await c.env.AI.run('@cf/bge-small-en-v1.5', {
      text: body.text
    })

    const duration = Date.now() - startTime
    console.log('Workers AI response time:', duration, 'ms')

    return c.json({
      success: true,
      embedding,
      duration_ms: duration
    })
  } catch (error: unknown) {
    console.error('Workers AI Error:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }, 500)
  }
})

// Test Vectorize
app.post('/test/vectorize', async (c) => {
  const body = await c.req.json()
  if (!body.text || typeof body.text !== 'string') {
    return c.json({ success: false, error: 'Invalid input: text field is required and must be a string' }, 400)
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const embedding = await c.env.AI.run('@cf/bge-small-en-v1.5', {
      text: body.text
    })

    clearTimeout(timeout)
    const id = crypto.randomUUID()

    await c.env.VECTORIZE.upsert([{
      id,
      values: embedding.data[0],
      metadata: { content: body.text }
    }])

    const results = await c.env.VECTORIZE.query(embedding.data[0], {
      topK: 1,
      filter: {},
      returnMetadata: true
    })

    return c.json({ success: true, results })
  } catch (err: unknown) {
    console.error('Vectorize Error:', err)
    if (err instanceof Error && err.name === 'AbortError') {
      return c.json({ success: false, error: 'Request timed out' }, 504)
    }
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, 500)
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
  } catch (err: unknown) {
    console.error('Queue Error:', err)
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, 500)
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
  } catch (err: unknown) {
    console.error('Email Handler Error:', err)
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})

// Test Workflow
app.post('/test/workflow', async (c) => {
  try {
    const workflowId = crypto.randomUUID()
    await c.env.KNOWLEDGE_WORKFLOW.dispatch(workflowId, {
      type: 'knowledge_processed',
      businessId: 'test-business',
      content: 'Test workflow execution',
      metadata: {
        source: 'test',
        timestamp: new Date().toISOString()
      }
    })
    return c.json({ success: true, workflowId })
  } catch (err: unknown) {
    console.error('Workflow Error:', err)
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})

export { ChatSession, KnowledgeWorkflow }
export default app
