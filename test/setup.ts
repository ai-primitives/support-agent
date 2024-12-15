import { beforeAll, beforeEach, vi } from 'vitest'
import { unstable_dev } from 'wrangler'

// Mock external dependencies
vi.mock('@cloudflare/ai', () => ({
  Ai: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ response: 'test response', text: 'test text' }),
    generateEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]])
  }))
}))

// Mock Vectorize since local bindings aren't supported
vi.mock('@cloudflare/workers-types', () => ({
  Vectorize: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue([{ id: 'test', score: 0.9 }]),
    insert: vi.fn().mockResolvedValue({ success: true }),
    upsert: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true })
  }))
}))

let worker: any

beforeAll(async () => {
  worker = await unstable_dev('src/index.ts', {
    experimental: { disableExperimentalWarning: true },
    vars: {
      ENVIRONMENT: 'test',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
      VECTORIZE_INDEX_NAME: 'test-index',
      DB_NAME: 'test-db',
      AI_MODEL: 'test-model'
    }
  })

  // Initialize database schema using worker's fetch
  const response = await worker.fetch('/api/setup', {
    method: 'POST'
  })

  if (!response.ok) {
    throw new Error('Failed to initialize database schema')
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

export const setup = async () => worker
