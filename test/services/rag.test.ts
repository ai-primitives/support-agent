import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RAGService } from '../../src/services/rag.js'
import { VectorizeService } from '../../src/services/vectorize.js'
import { Ai } from '@cloudflare/ai'
import type { Env } from '../../src/types.js'

describe('RAGService', () => {
  let ragService: RAGService
  let mockAi: Ai
  let mockVectorizeService: VectorizeService
  let mockEnv: Env

  beforeEach(() => {
    mockAi = {
      run: vi.fn().mockResolvedValue({
        response: 'AI generated response',
        text: 'AI generated text'
      })
    } as unknown as Ai

    mockVectorizeService = {
      search: vi.fn().mockResolvedValue({
        matches: [{
          id: 'test-id',
          score: 0.9,
          metadata: {
            content: 'relevant knowledge base content'
          }
        }]
      })
    } as unknown as VectorizeService

    mockEnv = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({
              id: 'test-persona',
              business_id: 'test-business',
              name: 'Test Persona',
              config: '{}',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          })
        })
      }
    } as unknown as Env

    ragService = new RAGService(mockAi, mockVectorizeService, mockEnv)
  })

  describe('generateResponse', () => {
    it('should generate a response using context from vector search', async () => {
      const query = 'test question'
      const businessId = 'test-business'

      const response = await ragService.generateResponse(query, businessId)

      expect(mockVectorizeService.search).toHaveBeenCalledWith(
        query,
        { business_id: businessId },
        5
      )
      expect(mockAi.run).toHaveBeenCalledWith(
        '@cf/meta/llama-2-7b-chat-int8',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' })
          ])
        })
      )
      expect(response).toBe('AI generated text')
    })

    it('should include persona configuration when provided', async () => {
      const query = 'test question'
      const businessId = 'test-business'
      const personaId = 'test-persona'

      const response = await ragService.generateResponse(query, businessId, personaId)

      expect(mockEnv.DB.prepare).toHaveBeenCalled()
      expect(mockAi.run).toHaveBeenCalledWith(
        '@cf/meta/llama-2-7b-chat-int8',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('Test Persona')
            })
          ])
        })
      )
      expect(response).toBe('AI generated text')
    })
  })
})
