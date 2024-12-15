import { Hono } from 'hono'
import { Bindings, VectorSearchResult, AiResponse } from './types'
import { VectorizeIndex, VectorizeMatches } from '@cloudflare/workers-types'
import { Ai } from '@cloudflare/workers-types'

const app = new Hono<{ Bindings: Bindings }>()

async function searchVectorStore(
  index: VectorizeIndex,
  ai: Ai,
  query: string,
  businessId: string,
  limit: number = 5
): Promise<VectorSearchResult[]> {
  try {
    const embedding = await ai.run('@cf/baai/bge-small-en-v1.5', {
      text: [query]
    })

    if (!embedding || !embedding.data || !embedding.data.length) {
      throw new Error('Failed to generate embedding')
    }

    const results: VectorizeMatches = await index.query(embedding.data[0], {
      topK: limit,
      filter: { business_id: businessId }
    })

    return results.matches.map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata as {
        content: string
        business_id: string
        persona: string
      }
    }))
  } catch (error) {
    console.error('Vector search failed:', error)
    throw new Error('Failed to search vector store')
  }
}

async function generateResponse(
  index: VectorizeIndex,
  ai: Ai,
  query: string,
  businessId: string,
  persona: string
): Promise<AiResponse> {
  try {
    const context = await searchVectorStore(index, ai, query, businessId)

    if (context.length === 0) {
      throw new Error('No relevant context found')
    }

    const contextText = context
      .map(doc => doc.metadata.content)
      .join('\n\n')

    const completion = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content: `You are a support agent for ${persona}. Use the following context to answer the question: ${contextText}`
        },
        {
          role: 'user',
          content: query
        }
      ]
    })

    const responseText = Array.isArray(completion) ? completion[0] : String(completion)

    return {
      text: responseText,
      metadata: {
        business_id: businessId,
        persona,
        context_used: context.map(doc => doc.id)
      }
    }
  } catch (error) {
    console.error('RAG pipeline failed:', error)
    throw error
  }
}

app.post('/api/chat', async (c) => {
  const { query, businessId, persona } = await c.req.json()

  if (!query || !businessId || !persona) {
    return c.json({ error: 'Missing required parameters' }, 400)
  }

  try {
    const response = await generateResponse(
      c.env.SUPPORT_VECTORIZE,
      c.env.SUPPORT_AI,
      query,
      businessId,
      persona
    )

    return c.json(response)
  } catch (error) {
    console.error('Chat endpoint failed:', error)
    return c.json({
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default app
