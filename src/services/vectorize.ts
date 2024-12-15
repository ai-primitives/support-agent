import { Ai } from '@cloudflare/ai'
import type { Env, VectorSearchResult } from '../types.js'

interface AiTextEmbeddingsOutput {
  data: Array<{
    embedding: number[]
    index: number
    object: string
  }>
}

export class VectorizeService {
  constructor(
    private ai: Ai,
    private index: Env['VECTORIZE_INDEX']
  ) {}

  async addEntry(content: string, metadata: Record<string, unknown>): Promise<string> {
    const embedding = (await this.ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [content]
    })) as unknown as AiTextEmbeddingsOutput

    const id = crypto.randomUUID()

    await this.index.insert([
      {
        id,
        values: embedding.data[0].embedding,
        metadata: {
          content,
          ...metadata
        }
      }
    ])

    return id
  }

  async search(
    query: string,
    filter?: Record<string, unknown>,
    limit: number = 5
  ): Promise<{ matches: VectorSearchResult[] }> {
    const queryEmbedding = (await this.ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [query]
    })) as unknown as AiTextEmbeddingsOutput

    return this.index.query(queryEmbedding.data[0].embedding, {
      topK: limit,
      filter
    })
  }

  async deleteEntry(id: string): Promise<void> {
    await this.index.delete([id])
  }

  async updateEntry(
    id: string,
    content: string,
    metadata: Record<string, unknown>
  ): Promise<string> {
    await this.deleteEntry(id)
    return this.addEntry(content, metadata)
  }
}

export const createVectorizeService = (env: Env): VectorizeService => {
  const ai = new Ai(env)
  return new VectorizeService(ai, env.VECTORIZE_INDEX)
}
