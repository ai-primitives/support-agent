import { Ai } from '@cloudflare/ai'
import { VectorizeService } from './vectorize.js'
import type { Env, CustomerPersona, VectorSearchResult } from '../types.js'

interface AiChatOutput {
  response: string
  text: string
}

export class RAGService {
  constructor(
    private ai: Ai,
    private vectorizeService: VectorizeService,
    private env: Env
  ) {}

  private async generateSystemPrompt(persona: CustomerPersona | null): Promise<string> {
    const basePrompt = `You are a helpful customer support agent.
Your goal is to assist users by providing accurate and relevant information.
Always be professional, clear, and concise in your responses.`

    if (persona) {
      return `${basePrompt}
Personality: ${persona.name}
Configuration: ${JSON.stringify(persona.config, null, 2)}`
    }

    return basePrompt
  }

  async generateResponse(
    query: string,
    businessId: string,
    personaId?: string,
    maxResults: number = 5
  ): Promise<string> {
    // Get relevant knowledge base entries
    const searchResults = await this.vectorizeService.search(
      query,
      { business_id: businessId },
      maxResults
    )

    // Get persona if provided
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

    // Generate system prompt
    const systemPrompt = await this.generateSystemPrompt(persona)

    // Format context from search results
    const context = searchResults.matches
      .map((match: VectorSearchResult) => match.metadata.content)
      .join('\n\n')

    // Generate response using AI
    const response = (await this.ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
      ]
    })) as unknown as AiChatOutput

    return response.text || response.response
  }
}

export const createRAGService = (env: Env): RAGService => {
  const ai = new Ai(env)
  const vectorizeService = new VectorizeService(ai, env.VECTORIZE_INDEX)
  return new RAGService(ai, vectorizeService, env)
}
