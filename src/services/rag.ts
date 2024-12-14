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

interface VectorizeMatch {
  id: string
  score: number
  metadata: Record<string, unknown>
}

interface VectorizeQueryResponse {
  matches: VectorizeMatch[]
}

const VECTOR_DIMENSIONS = 384 // bge-small-en-v1.5 dimension
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export class RAGService {
  constructor(private env: Env) {}

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async generateEmbeddingWithRetry(text: string, retries = 0): Promise<number[]> {
    try {
      const response = await this.env.AI.run('@cf/bge-small-en-v1.5', {
        text
      })

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

  async addKnowledge(entry: KnowledgeEntry): Promise<void> {
    if (!entry.content.trim()) {
      throw new Error('Content cannot be empty')
    }

    try {
      const embedding = await this.generateEmbeddingWithRetry(entry.content)

      await this.env.VECTORIZE.upsert([{
        id: entry.id,
        values: embedding,
        metadata: {
          businessId: entry.businessId,
          content: entry.content,
          ...entry.metadata
        }
      }])
    } catch (error) {
      throw new Error(`Failed to add knowledge: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async searchKnowledge(businessId: string, query: string, topK = 5): Promise<SearchResult[]> {
    if (!query.trim()) {
      throw new Error('Query cannot be empty')
    }

    try {
      const embedding = await this.generateEmbeddingWithRetry(query)

      const results = await this.env.VECTORIZE.query(embedding, {
        topK,
        filter: { businessId }, // Ensure business isolation
        returnMetadata: true
      }) as VectorizeQueryResponse

      return results.matches.map(match => ({
        id: match.id,
        content: match.metadata.content as string,
        metadata: match.metadata,
        score: match.score
      }))
    } catch (error) {
      throw new Error(`Failed to search knowledge: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async deleteKnowledge(id: string): Promise<void> {
    try {
      await this.env.VECTORIZE.delete([id])
    } catch (error) {
      throw new Error(`Failed to delete knowledge: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async deleteBusinessKnowledge(businessId: string): Promise<void> {
    try {
      // Note: In a production environment, we would need to handle pagination
      const results = await this.env.VECTORIZE.query(new Array(VECTOR_DIMENSIONS).fill(0), {
        topK: 1000,
        filter: { businessId },
        returnMetadata: true
      }) as VectorizeQueryResponse

      if (results.matches.length > 0) {
        await this.env.VECTORIZE.delete(results.matches.map(match => match.id))
      }
    } catch (error) {
      throw new Error(`Failed to delete business knowledge: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export async function handleRagQuery(text: string, env: Env): Promise<string> {
  const ragService = new RAGService(env);
  try {
    const results = await ragService.searchKnowledge('test-business', text);

    if (results.length === 0) {
      return 'I apologize, but I don\'t have enough information to answer your question accurately.';
    }

    const bestMatch = results[0];
    return bestMatch.content;
  } catch (error) {
    console.error('Error in RAG query:', error);
    return 'I apologize, but I encountered an error while processing your request.';
  }
}
