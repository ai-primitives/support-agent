import { Env } from '../bindings'

interface KnowledgeEntry {
  id: string
  businessId: string
  content: string
  metadata?: Record<string, unknown>
}

interface SearchResult {
  id: string
  content: string
  metadata?: Record<string, unknown>
  score: number
}

export class RAGService {
  constructor(private env: Env) {}

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.env.AI.run('@cf/bge-small-en-v1.5', {
      text
    })
    return response.data[0]
  }

  async addKnowledge(entry: KnowledgeEntry): Promise<void> {
    const embedding = await this.generateEmbedding(entry.content)

    await this.env.VECTORIZE.upsert([{
      id: entry.id,
      values: embedding,
      metadata: {
        businessId: entry.businessId,
        content: entry.content,
        ...entry.metadata
      }
    }])
  }

  async searchKnowledge(businessId: string, query: string, topK = 5): Promise<SearchResult[]> {
    const embedding = await this.generateEmbedding(query)

    const results = await this.env.VECTORIZE.query(embedding, {
      topK,
      filter: { businessId }, // Ensure business isolation
      returnMetadata: true
    })

    return results.matches.map(match => ({
      id: match.id,
      content: match.metadata.content as string,
      metadata: match.metadata,
      score: match.score
    }))
  }

  async deleteKnowledge(id: string): Promise<void> {
    await this.env.VECTORIZE.delete([id])
  }

  async deleteBusinessKnowledge(businessId: string): Promise<void> {
    // Note: In a production environment, we would need to handle pagination
    const results = await this.env.VECTORIZE.query(new Array(384).fill(0), {
      topK: 1000,
      filter: { businessId },
      returnMetadata: true
    })

    if (results.matches.length > 0) {
      await this.env.VECTORIZE.delete(results.matches.map(match => match.id))
    }
  }
}
