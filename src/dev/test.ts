import { Hono } from 'hono'
import { Env } from '../bindings'
import { MessagePayload } from '../types/workflow'

const app = new Hono<{ Bindings: Env }>()

// Mock data for local development
const MOCK_EMBEDDING = new Array(384).fill(0).map(() => Math.random())
const MOCK_VECTOR_ID = 'mock-vector-id'
const LOCAL_MODE = process.env.NODE_ENV !== 'production'

// Health check endpoint with binding status
app.get('/health', (c) => {
  const bindings = {
    ai: !!c.env.AI,
    vectorize: !!c.env.VECTORIZE,
    messageQueue: !!c.env.MESSAGE_QUEUE,
    knowledgeWorkflow: !!c.env.KNOWLEDGE_WORKFLOW,
    chatSessions: !!c.env.CHAT_SESSIONS,
  }
  return c.json({
    status: 'ok',
    bindings,
    mode: LOCAL_MODE ? 'local' : 'remote',
    timestamp: new Date().toISOString()
  })
})

// Test Workers AI endpoint with improved error handling and logging
app.post('/test/workers-ai', async (c) => {
  const startTime = performance.now()
  console.log('[Workers AI Test] Starting test...')

  try {
    const body = await c.req.json()
    if (!body.text || typeof body.text !== 'string') {
      return c.json({
        success: false,
        error: 'Invalid input: text field is required and must be a string'
      }, 400)
    }

    const aiBinding = {
      available: !!c.env.AI,
      model: '@cf/bge-small-en-v1.5'
    }
    console.log('[Workers AI Test] Binding status:', aiBinding)

    let embedding
    if (LOCAL_MODE || !aiBinding.available) {
      console.log('[Workers AI Test] Using mock embedding in local mode')
      embedding = MOCK_EMBEDDING
    } else {
      const embeddingResult = await c.env.AI.run('@cf/bge-small-en-v1.5', { text: body.text })
      embedding = embeddingResult.data[0]
    }

    const duration = performance.now() - startTime
    console.log(`[Workers AI Test] Completed in ${duration}ms`)

    return c.json({
      success: true,
      embedding,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    })
  } catch (error: unknown) {
    const duration = performance.now() - startTime
    console.error('[Workers AI Test] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      duration_ms: Math.round(duration)
    })

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    }, 500)
  }
})

// Test Vectorize endpoint with improved error handling
app.post('/test/vectorize', async (c) => {
  const startTime = performance.now()
  console.log('[Vectorize Test] Starting test...')

  try {
    const body = await c.req.json()
    if (!body.text || typeof body.text !== 'string') {
      return c.json({
        success: false,
        error: 'Invalid input: text field is required and must be a string'
      }, 400)
    }

    let embedding, queryResult
    if (LOCAL_MODE || !c.env.VECTORIZE) {
      console.log('[Vectorize Test] Using mock data in local mode')
      embedding = MOCK_EMBEDDING
      queryResult = [{
        id: MOCK_VECTOR_ID,
        score: 0.95,
        values: MOCK_EMBEDDING,
        metadata: { text: body.text }
      }]
    } else {
      embedding = (await c.env.AI.run('@cf/bge-small-en-v1.5', { text: body.text })).data[0]
      const id = crypto.randomUUID()
      await c.env.VECTORIZE.upsert([{
        id,
        values: embedding,
        metadata: { text: body.text }
      }])
      queryResult = await c.env.VECTORIZE.query(embedding, { topK: 1 })
    }

    const duration = performance.now() - startTime
    console.log(`[Vectorize Test] Completed in ${duration}ms`)

    return c.json({
      success: true,
      embedding,
      queryResult,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    })
  } catch (error: unknown) {
    const duration = performance.now() - startTime
    console.error('[Vectorize Test] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      duration_ms: Math.round(duration)
    })

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    }, 500)
  }
})

// Test Queue endpoint with mock support
app.post('/test/queue', async (c) => {
  const startTime = performance.now()
  console.log('[Queue Test] Starting test...')

  try {
    const body = await c.req.json() as MessagePayload
    if (!body.type || !body.businessId) {
      return c.json({
        success: false,
        error: 'Invalid input: type and businessId are required'
      }, 400)
    }

    if (LOCAL_MODE || !c.env.MESSAGE_QUEUE) {
      console.log('[Queue Test] Using mock queue in local mode')
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate queue latency
    } else {
      await c.env.MESSAGE_QUEUE.send(body)
    }

    const duration = performance.now() - startTime
    console.log(`[Queue Test] Completed in ${duration}ms`)

    return c.json({
      success: true,
      message: 'Message processed',
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    })
  } catch (error: unknown) {
    const duration = performance.now() - startTime
    console.error('[Queue Test] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      duration_ms: Math.round(duration)
    })

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    }, 500)
  }
})

// Test Workflow endpoint with mock support
app.post('/test/workflow', async (c) => {
  const startTime = performance.now()
  console.log('[Workflow Test] Starting test...')

  try {
    const body = await c.req.json()
    if (!body.type || !body.payload) {
      return c.json({
        success: false,
        error: 'Invalid input: type and payload are required'
      }, 400)
    }

    let workflowId
    if (LOCAL_MODE || !c.env.KNOWLEDGE_WORKFLOW) {
      console.log('[Workflow Test] Using mock workflow in local mode')
      workflowId = crypto.randomUUID()
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate workflow latency
    } else {
      workflowId = await c.env.KNOWLEDGE_WORKFLOW.start(body)
    }

    const duration = performance.now() - startTime
    console.log(`[Workflow Test] Completed in ${duration}ms`)

    return c.json({
      success: true,
      workflowId,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    })
  } catch (error: unknown) {
    const duration = performance.now() - startTime
    console.error('[Workflow Test] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      duration_ms: Math.round(duration)
    })

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      mode: LOCAL_MODE ? 'local' : 'remote',
      duration_ms: Math.round(duration)
    }, 500)
  }
})

// Add email handler endpoint
app.post('/test/email', async (c) => {
  const start = Date.now();
  try {
    const body = await c.req.json();
    const { from, subject, content } = body;

    if (!from || !subject || !content) {
      return c.json({
        error: 'Missing required fields: from, subject, content',
        mode: 'local',
        duration_ms: Date.now() - start
      }, 400);
    }

    // Mock email processing
    const mockResponse = {
      success: true,
      messageId: crypto.randomUUID(),
      status: 'queued',
      mode: 'local',
      duration_ms: Date.now() - start,
      response: {
        from: 'support@example.com',
        to: from,
        subject: `Re: ${subject}`,
        text: `Thank you for your message. Our AI assistant is processing your request: "${content}"`
      }
    };

    console.log('[Email Test] Mock Response:', mockResponse);
    return c.json(mockResponse);

  } catch (error) {
    console.error('[Email Test] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'local',
      duration_ms: Date.now() - start
    }, 500);
  }
});

// Add Slack handler endpoint
app.post('/test/slack', async (c) => {
  const start = Date.now();
  try {
    const body = await c.req.json();
    const { channel, user, text, thread_ts } = body;

    if (!channel || !user || !text) {
      return c.json({
        error: 'Missing required fields: channel, user, text',
        mode: 'local',
        duration_ms: Date.now() - start
      }, 400);
    }

    // Mock Slack processing
    const mockResponse = {
      success: true,
      messageId: crypto.randomUUID(),
      status: 'queued',
      mode: 'local',
      duration_ms: Date.now() - start,
      response: {
        channel,
        text: `Hi <@${user}>, thanks for your message! Our AI assistant is processing: "${text}"`,
        thread_ts,
      }
    };

    console.log('[Slack Test] Mock Response:', mockResponse);
    return c.json(mockResponse);

  } catch (error) {
    console.error('[Slack Test] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'local',
      duration_ms: Date.now() - start
    }, 500);
  }
});

// Add Chat Widget handler endpoint
app.post('/test/chat', async (c) => {
  const start = Date.now();
  try {
    const body = await c.req.json();
    const { sessionId, userId, text } = body;

    if (!sessionId || !userId || !text) {
      return c.json({
        error: 'Missing required fields: sessionId, userId, text',
        mode: 'local',
        duration_ms: Date.now() - start
      }, 400);
    }

    // Mock Chat processing
    const mockResponse = {
      success: true,
      messageId: crypto.randomUUID(),
      status: 'queued',
      mode: 'local',
      duration_ms: Date.now() - start,
      response: {
        sessionId,
        userId,
        text: `Thanks for your message! Our AI assistant is processing: "${text}"`,
        timestamp: new Date().toISOString()
      }
    };

    console.log('[Chat Test] Mock Response:', mockResponse);
    return c.json(mockResponse);

  } catch (error) {
    console.error('[Chat Test] Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'local',
      duration_ms: Date.now() - start
    }, 500);
  }
});

// Export test app
export default app

// Function to run all tests sequentially
export async function runTests(env: Env) {
  console.log('Running all tests...')
  const results = {
    health: await app.fetch(new Request('http://localhost:8787/health'), env),
    workersAi: await app.fetch(new Request('http://localhost:8787/test/workers-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test embedding generation' })
    }), env),
    vectorize: await app.fetch(new Request('http://localhost:8787/test/vectorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test vector storage' })
    }), env),
    queue: await app.fetch(new Request('http://localhost:8787/test/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test', businessId: 'test-business' })
    }), env),
    workflow: await app.fetch(new Request('http://localhost:8787/test/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test', payload: { businessId: 'test-business' } })
    }), env),
    email: await app.fetch(new Request('http://localhost:8787/test/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'test@example.com',
        subject: 'Test Email',
        content: 'Test content'
      })
    }), env),
    chat: await app.fetch(new Request('http://localhost:8787/test/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test-session',
        userId: 'test-user',
        text: 'Test message'
      })
    }), env),
    slack: await app.fetch(new Request('http://localhost:8787/test/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'test-channel',
        user: 'test-user',
        text: 'Test message',
        thread_ts: '1234567890.123456'
      })
    }), env)
  }

  for (const [test, response] of Object.entries(results)) {
    console.log(`${test} test:`, await response.json())
  }
  console.log('All tests completed')
  return results
}
