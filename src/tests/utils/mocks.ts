import { VectorizeIndex, Ai, Queue } from '@cloudflare/workers-types'
import { vi } from 'vitest'

export const createMockVectorizeIndex = (matches = []): VectorizeIndex => ({
  query: vi.fn().mockResolvedValue({ matches }),
  describe: vi.fn(),
  insert: vi.fn(),
  upsert: vi.fn(),
  deleteByIds: vi.fn(),
  getByIds: vi.fn()
})

export const createMockAi = (response: any = 'Test response'): Ai => ({
  run: vi.fn().mockImplementation(async (model: string, params: any) => {
    if (model.includes('bge-small')) {
      return { data: [new Float32Array(384)] }
    }
    return response
  }),
  aiGatewayLogId: 'test-log-id',
  gateway: vi.fn().mockReturnValue({
    fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify({ response })))
  })
})

export const createMockQueue = <T>(): Queue<T> => ({
  send: vi.fn(),
  sendBatch: vi.fn()
})
