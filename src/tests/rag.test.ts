import { describe, it, expect, vi } from 'vitest'
import { generateResponse } from '../worker'
import { createMockVectorizeIndex, createMockAi } from './utils/mocks'

describe('RAG Pipeline', () => {
  const mockVectorizeIndex = createMockVectorizeIndex([
    {
      id: 'doc1',
      score: 0.9,
      metadata: {
        content: 'Test content 1',
        business_id: 'business1',
        persona: 'support'
      }
    }
  ])

  const mockAi = createMockAi({ response: 'Mocked AI response' })

  it('should generate response with proper context', async () => {
    const response = await generateResponse(
      mockVectorizeIndex,
      mockAi,
      'test query',
      'business1',
      'support'
    )

    expect(mockVectorizeIndex.query).toHaveBeenCalled()
    expect(mockAi.run).toHaveBeenCalledTimes(2) // Once for embedding, once for response
    expect(response.text).toBeDefined()
    expect(response.metadata?.business_id).toBe('business1')
  })

  it('should handle empty context results', async () => {
    const emptyVectorizeIndex = createMockVectorizeIndex([])

    await expect(
      generateResponse(
        emptyVectorizeIndex,
        mockAi,
        'test query',
        'business1',
        'support'
      )
    ).rejects.toThrow('No relevant context found')
  })

  it('should respect business isolation', async () => {
    await generateResponse(
      mockVectorizeIndex,
      mockAi,
      'test query',
      'business1',
      'support'
    )

    expect(mockVectorizeIndex.query).toHaveBeenCalledWith(
      expect.any(Float32Array),
      expect.objectContaining({
        filter: { business_id: 'business1' }
      })
    )
  })
})
