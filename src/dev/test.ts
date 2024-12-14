import { Env } from '../bindings'

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

async function testWorkersAI(env: Env) {
  console.log('Testing Workers AI embeddings...')
  try {
    const text = 'This is a test message for embedding generation.'
    const embedding = await env.AI.run('@cf/bge-small-en-v1.5', {
      text
    })
    console.log('✅ Workers AI embedding generated successfully')
    return embedding
  } catch (error) {
    console.error('❌ Workers AI test failed:', error)
    throw error
  }
}

async function testVectorize(env: Env, embedding: number[]) {
  console.log('Testing Vectorize operations...')
  try {
    const id = crypto.randomUUID()
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
  } catch (error) {
    console.error('❌ Vectorize test failed:', error)
    throw error
  }
}

async function testQueue(env: Env) {
  console.log('Testing Message Queue...')
  try {
    await env.MESSAGE_QUEUE.send({
      type: 'chat',
      businessId: 'test-business',
      conversationId: crypto.randomUUID(),
      content: 'Test message'
    })
    console.log('✅ Message Queue send successful')
  } catch (error) {
    console.error('❌ Message Queue test failed:', error)
    throw error
  }
}

async function testWorkflow(env: Env) {
  console.log('Testing Knowledge Workflow...')
  try {
    const result = await env.KNOWLEDGE_WORKFLOW.run({
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
    console.log('✅ Knowledge Workflow execution successful:', result)
  } catch (error) {
    console.error('❌ Knowledge Workflow test failed:', error)
    throw error
  }
}

async function testAPI() {
  console.log('Testing Hono API endpoints...')
  try {
    const baseUrl = 'http://localhost:8787'

    // Test business creation
    const businessResponse = await fetch(`${baseUrl}/api/businesses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Business',
        domain: 'test.com'
      })
    })
    const business = await businessResponse.json() as BusinessResponse
    console.log('✅ Business creation successful:', business)

    // Test persona creation
    const personaResponse = await fetch(`${baseUrl}/api/businesses/${business.id}/personas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Persona',
        description: 'A test customer persona'
      })
    })
    const persona = await personaResponse.json() as PersonaResponse
    console.log('✅ Persona creation successful:', persona)

    // Test knowledge base
    const knowledgeResponse = await fetch(`${baseUrl}/api/businesses/${business.id}/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'This is a test knowledge entry.',
        metadata: { source: 'test' }
      })
    })
    console.log('✅ Knowledge base entry successful:', await knowledgeResponse.json())

    // Test knowledge search
    const searchResponse = await fetch(
      `${baseUrl}/api/businesses/${business.id}/knowledge/search?query=test`,
      { method: 'GET' }
    )
    console.log('✅ Knowledge search successful:', await searchResponse.json())
  } catch (error) {
    console.error('❌ API test failed:', error)
    throw error
  }
}

// Run all tests
export async function runTests(env: Env) {
  try {
    console.log('Starting integration tests...')
    const embedding = await testWorkersAI(env)
    await testVectorize(env, embedding)
    await testQueue(env)
    await testWorkflow(env)
    await testAPI()
    console.log('✅ All tests completed successfully')
  } catch (error) {
    console.error('❌ Tests failed:', error)
  }
}
