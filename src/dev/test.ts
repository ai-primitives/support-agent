import { Env } from '../bindings'
import { Hono } from 'hono'
import { ChatSession } from '../durable_objects/chat_session'
import { KnowledgeWorkflow } from '../workflows/knowledge'

interface BusinessResponse {
  id: string
  name: string
  domain: string
}

interface PersonaResponse {
  id: string
  businessId: string
  name: string
  description: string
}

const LOCAL_MODE = true // Enable local development mode
const TEST_TIMEOUT = 10000 // 10 second timeout for tests

async function testWorkersAI(env: Env) {
  console.log('Testing Workers AI embeddings...')
  try {
    const text = 'This is a test message for embedding generation.'
    if (LOCAL_MODE) {
      console.log('Running in local mode - using mock embedding')
      return new Array(384).fill(0).map(() => Math.random()) // Mock 384-dimensional embedding
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT)

    try {
      const embedding = await env.AI.run('@cf/bge-small-en-v1.5', {
        text
      })
      console.log('✅ Workers AI embedding generated successfully')
      return embedding
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('❌ Workers AI test timed out')
      throw new Error('Workers AI test timed out')
    }
    console.error('❌ Workers AI test failed:', error)
    throw error
  }
}

async function testVectorize(env: Env, embedding: number[]) {
  console.log('Testing Vectorize operations...')
  try {
    const id = crypto.randomUUID()
    if (LOCAL_MODE) {
      console.log('Running in local mode - using mock Vectorize operations')
      return { matches: [{ id, score: 1.0 }] }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT)

    try {
      await env.VECTORIZE.upsert([{
        id,
        values: embedding,
        metadata: { text: 'Test document' }
      }])
      console.log('✅ Vectorize upsert successful')

      const results = await env.VECTORIZE.query({
        vector: embedding,
        topK: 1
      })
      console.log('✅ Vectorize query successful:', results)
      return results
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('❌ Vectorize test timed out')
      throw new Error('Vectorize test timed out')
    }
    console.error('❌ Vectorize test failed:', error)
    throw error
  }
}

async function testQueue(env: Env) {
  console.log('Testing Message Queue...')
  try {
    if (LOCAL_MODE) {
      console.log('Running in local mode - using mock queue operations')
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT)

    try {
      await env.MESSAGE_QUEUE.send({
        type: 'chat',
        businessId: 'test-business',
        conversationId: crypto.randomUUID(),
        content: 'Test message'
      })
      console.log('✅ Message Queue send successful')
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('❌ Message Queue test timed out')
      throw new Error('Message Queue test timed out')
    }
    console.error('❌ Message Queue test failed:', error)
    throw error
  }
}

async function testWorkflow(env: Env) {
  console.log('Testing Knowledge Workflow...')
  try {
    if (LOCAL_MODE) {
      console.log('Running in local mode - using mock workflow operations')
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT)

    try {
      await env.KNOWLEDGE_WORKFLOW.run({
        data: {
          businessId: 'test-business',
          content: 'Test knowledge entry',
          metadata: { source: 'test' }
        }
      }, {
        do: async (name: string, fn: () => Promise<void>) => {
          console.log(`Executing step: ${name}`)
          await fn()
        }
      }, env)
      console.log('✅ Knowledge Workflow execution successful')
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('❌ Knowledge Workflow test timed out')
      throw new Error('Knowledge Workflow test timed out')
    }
    console.error('❌ Knowledge Workflow test failed:', error)
    throw error
  }
}

// Create Hono app for test endpoints
const app = new Hono<{ Bindings: Env }>()

// Add individual test endpoints
app.get('/test/ai', async (c) => {
  try {
    const embedding = await testWorkersAI(c.env)
    return c.json({ status: 'success', embedding })
  } catch (error) {
    return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

app.get('/test/vectorize', async (c) => {
  try {
    const embedding = await testWorkersAI(c.env)
    await testVectorize(c.env, embedding)
    return c.json({ status: 'success' })
  } catch (error) {
    return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

app.get('/test/queue', async (c) => {
  try {
    await testQueue(c.env)
    return c.json({ status: 'success' })
  } catch (error) {
    return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

app.get('/test/workflow', async (c) => {
  try {
    await testWorkflow(c.env)
    return c.json({ status: 'success' })
  } catch (error) {
    return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Main test endpoint that runs all tests
app.get('/test', async (c) => {
  const results = {
    ai: false,
    vectorize: false,
    queue: false,
    workflow: false
  }

  try {
    console.log('Starting integration tests...')
    const embedding = await testWorkersAI(c.env)
    results.ai = true

    await testVectorize(c.env, embedding)
    results.vectorize = true

    await testQueue(c.env)
    results.queue = true

    await testWorkflow(c.env)
    results.workflow = true

    console.log('✅ All tests completed successfully')
    return c.json({ status: 'success', results })
  } catch (error) {
    console.error('❌ Tests failed:', error)
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      results
    }, 500)
  }
})

// Export default fetch handler for module worker
export default app

// Export required classes for Cloudflare Workers
export { ChatSession, KnowledgeWorkflow }
