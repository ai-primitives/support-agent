import { beforeAll, beforeEach, afterAll, vi } from 'vitest'
import { SELF } from 'cloudflare:test'
import '../src'

// Mock external dependencies
vi.mock('@cloudflare/ai', () => ({
  Ai: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({ response: 'test response', text: 'test text' }),
    generateEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]])
  }))
}))

beforeAll(async () => {
  // Initialize environment variables
  process.env.ENVIRONMENT = 'test'
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key'
  process.env.VECTORIZE_INDEX_NAME = 'test-index'
  process.env.DB_NAME = 'test-db'
  process.env.AI_MODEL = 'test-model'
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterAll(async () => {
  vi.resetModules()
})
