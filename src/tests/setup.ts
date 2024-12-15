import { vi } from 'vitest'

// Mock Cloudflare AI
const mockAI = {
  run: vi.fn().mockResolvedValue({ response: 'Mocked AI response' }),
  prepare: vi.fn().mockResolvedValue({ response: 'Mocked preparation' })
}

// Mock Vectorize
const mockVectorize = {
  query: vi.fn().mockResolvedValue([{ id: '1', score: 0.9, metadata: { text: 'Mocked vector result' } }]),
  upsert: vi.fn().mockResolvedValue({ count: 1 }),
  delete: vi.fn().mockResolvedValue({ count: 1 })
}

// Mock D1 Database
const mockD1 = {
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ id: 1, name: 'test' }),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue([{ id: 1, name: 'test' }])
  })
}

// Extend the global scope
declare global {
  interface WebSocket extends EventTarget {
    accept(): void
    send(data: string): void
    addEventListener(type: string, listener: (event: MessageEvent) => void): void
    removeEventListener(type: string, listener: (event: MessageEvent) => void): void
  }
}

// Mock WebSocketPair constructor
const mockWebSocketPair = () => {
  const client = new EventTarget() as WebSocket
  const server = new EventTarget() as WebSocket

  client.send = vi.fn()
  server.send = vi.fn()
  server.accept = vi.fn()

  client.addEventListener = vi.fn()
  server.addEventListener = vi.fn()
  client.removeEventListener = vi.fn()
  server.removeEventListener = vi.fn()

  return { 0: client, 1: server }
}

// Set up global mocks
;(globalThis as any).WebSocketPair = vi.fn(mockWebSocketPair)
;(globalThis as any).AI = mockAI
;(globalThis as any).VECTORIZE_INDEX = mockVectorize
;(globalThis as any).DB = mockD1
