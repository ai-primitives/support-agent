import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VectorizeService } from '../../src/services/vectorize.js'
import { Ai } from '@cloudflare/ai'

describe('VectorizeService', () => {
  let vectorizeService: VectorizeService
  let mockAi: Ai
  let mockIndex: any

  beforeEach(() => {
    mockAi = {
      run: vi.fn().mockResolvedValue({
        data: [{
          embedding: new Array(768).fill(0),
          index: 0,
          object: 'embedding'
        }]
      })
    } as unknown as Ai

    mockIndex = {
      insert: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({
        matches: [{
          id: 'test-id',
          score: 0.9,
          metadata: {
            content: 'test content'
          }
        }]
      }),
      delete: vi.fn().mockResolvedValue(undefined)
    }

    vectorizeService = new VectorizeService(mockAi, mockIndex)
  })

  describe('addEntry', () => {
    it('should generate embeddings and store them in the index', async () => {
      const content = 'test content'
      const metadata = { business_id: 'test-business' }

      const id = await vectorizeService.addEntry(content, metadata)

      expect(mockAi.run).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', {
        text: [content]
      })
      expect(mockIndex.insert).toHaveBeenCalledWith([{
        id: expect.any(String),
        values: expect.any(Array),
        metadata: {
          content,
          ...metadata
        }
      }])
      expect(id).toBeDefined()
    })
  })

  describe('search', () => {
    it('should search for similar content using vector embeddings', async () => {
      const query = 'test query'
      const filter = { business_id: 'test-business' }

      const result = await vectorizeService.search(query, filter)

      expect(mockAi.run).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', {
        text: [query]
      })
      expect(mockIndex.query).toHaveBeenCalledWith(
        expect.any(Array),
        {
          topK: 5,
          filter
        }
      )
      expect(result.matches).toHaveLength(1)
      expect(result.matches[0].metadata.content).toBe('test content')
    })
  })
})
