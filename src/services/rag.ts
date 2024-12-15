import { Ai } from '@cloudflare/ai'
import { VectorizeService } from './vectorize.js'
import type { Env, CustomerPersona, VectorSearchResult, KnowledgeBaseEntry } from '../types'

interface AiChatOutput {
  response: string
  text: string
}

const VECTOR_DIMENSIONS = 384 // bge-small-en-v1.5 dimension
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export class RAGService {
  private ai: Ai
  private vectorizeService: VectorizeService

  constructor(private env: Env) {
    this.ai = new Ai(env)
    this.vectorizeService = new VectorizeService(this.ai, env.VECTORIZE_INDEX)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      if (globalThis.setTimeout) {
        globalThis.setTimeout(resolve, ms)
      } else {
        resolve()
      }
    })
  }

  private async generateEmbeddingWithRetry(text: string, retries = 0): Promise<number[]> {
    try {
      const response = await this.ai.run('@cf/baai/bge-base-en', {
        text
      }) as { data: number[][] }

      const embedding = response.data[0]
      if (!Array.isArray(embedding) || embedding.length !== VECTOR_DIMENSIONS) {
        throw new Error(`Invalid embedding dimensions: expected ${VECTOR_DIMENSIONS}, got ${embedding?.length}`)
      }

      return embedding
    } catch (error) {
      if (retries < MAX_RETRIES) {
        await this.sleep(RETRY_DELAY * (retries + 1))
        return this.generateEmbeddingWithRetry(text, retries + 1)
      }
      throw new Error(`Failed to generate embedding after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async addKnowledge(entry: KnowledgeBaseEntry): Promise<void> {
    if (!entry.content.trim()) {
      throw new Error('Content cannot be empty')
    }

    try {
      const embedding = await this.generateEmbeddingWithRetry(entry.content)

      await this.env.VECTORIZE_INDEX.upsert([{
        id: entry.embedding_id || entry.id,
        values: embedding,
        metadata: {
          business_id: entry.business_id,
          content: entry.content,
          ...entry.metadata
        }
      }])
    } catch (error) {
      throw new Error(`Failed to add knowledge: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async generateResponse(
    query: string,
    businessId: string,
    personaId?: string,
    maxResults: number = 5
  ): Promise<string> {
    const searchResults = await this.vectorizeService.search(
      query,
      { business_id: businessId },
      maxResults
    )

    let persona: CustomerPersona | null = null
    if (personaId) {
      const result = await this.env.DB
        .prepare('SELECT * FROM customer_personas WHERE id = ? AND business_id = ?')
        .bind(personaId, businessId)
        .first()

      if (result) {
        persona = {
          id: result.id as string,
          business_id: result.business_id as string,
          name: result.name as string,
          config: JSON.parse(result.config as string),
          created_at: result.created_at as string,
          updated_at: result.updated_at as string
        }
      }
    }

    const basePrompt = `You are a helpful customer support agent.
Your goal is to assist users by providing accurate and relevant information.
Always be professional, clear, and concise in your responses.`

    const systemPrompt = persona ?
      `${basePrompt}\nPersonality: ${persona.name}\nConfiguration: ${JSON.stringify(persona.config, null, 2)}` :
      basePrompt

    const context = searchResults.matches
      .map((match: VectorSearchResult) => match.metadata.content)
      .join('\n\n')

    const response = await this.ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
      ]
    }) as AiChatOutput

    return response.text || response.response
  }
}

export const createRAGService = (env: Env): RAGService => {
  return new RAGService(env)
}
