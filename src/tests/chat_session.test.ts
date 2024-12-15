import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { ChatSession } from '../durable_objects/chat_session'
import './setup'

describe('ChatSession', () => {
  let chatSession: ChatSession
  let mockState: DurableObjectState
  let mockWebSocketPair: { 0: WebSocket; 1: WebSocket }

  beforeEach(() => {
    const getMock = vi.fn()
    getMock.mockImplementation(async (key: string) => {
      if (key === 'chatState') {
        return {
          messages: [
            { role: 'user', content: 'test', timestamp: new Date().toISOString() }
          ]
        }
      }
      return undefined
    })

    mockState = {
      storage: {
        get: getMock,
        put: vi.fn(),
        delete: vi.fn()
      }
    } as unknown as DurableObjectState

    // Get WebSocketPair instance
    mockWebSocketPair = new WebSocketPair()
    const spyTarget = { WebSocketPair }
    vi.spyOn(spyTarget, 'WebSocketPair').mockReturnValue(mockWebSocketPair)
    globalThis.WebSocketPair = spyTarget.WebSocketPair

    chatSession = new ChatSession(mockState)
  })

  describe('WebSocket Connection', () => {
    it('should handle WebSocket upgrade request', async () => {
      const request = new Request('http://localhost', {
        headers: { 'Upgrade': 'websocket' }
      })

      const response = await chatSession.fetch(request)
      expect(response.status).toBe(101)
      expect(mockWebSocketPair[1].accept).toHaveBeenCalled()
    })

    it('should handle incoming WebSocket messages', async () => {
      const request = new Request('http://localhost', {
        headers: { 'Upgrade': 'websocket' }
      })

      await chatSession.fetch(request)

      const message = {
        type: 'message',
        messageId: '123',
        businessId: 'business1',
        personaId: 'persona1',
        message: 'Hello'
      }

      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(message)
      })

      await (mockWebSocketPair[1] as WebSocket & { dispatchEvent: Function })
        .dispatchEvent(messageEvent)

      expect(mockState.storage.put).toHaveBeenCalled()
      expect(mockWebSocketPair[1].send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ack"')
      )
    })

    it('should handle metadata updates via WebSocket', async () => {
      const request = new Request('http://localhost', {
        headers: { 'Upgrade': 'websocket' }
      })

      await chatSession.fetch(request)

      const message = {
        type: 'metadata',
        messageId: '123',
        businessId: 'business1',
        personaId: 'persona1',
        metadata: { key: 'value' }
      }

      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(message)
      })

      await (mockWebSocketPair[1] as WebSocket & { dispatchEvent: Function })
        .dispatchEvent(messageEvent)

      expect(mockState.storage.put).toHaveBeenCalled()
    })

    it('should handle WebSocket errors', async () => {
      const request = new Request('http://localhost', {
        headers: { 'Upgrade': 'websocket' }
      })

      await chatSession.fetch(request)

      const message = {
        type: 'invalid',
        messageId: '123'
      }

      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(message)
      })

      await (mockWebSocketPair[1] as WebSocket & { dispatchEvent: Function })
        .dispatchEvent(messageEvent)

      expect(mockWebSocketPair[1].send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      )
    })
  })

  describe('HTTP Endpoints', () => {
    it('should return messages via HTTP GET', async () => {
      const messages = [
        { role: 'user', content: 'test', timestamp: new Date().toISOString() }
      ]
      const getMock = mockState.storage.get as Mock
      getMock.mockImplementationOnce(async () => ({ messages }))

      const request = new Request('http://localhost/messages')
      const response = await chatSession.fetch(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual(messages)
    })

    it('should handle metadata updates via HTTP PUT', async () => {
      const request = new Request('http://localhost/metadata', {
        method: 'PUT',
        body: JSON.stringify({ key: 'value' })
      })

      const response = await chatSession.fetch(request)

      expect(response.status).toBe(200)
      expect(mockState.storage.put).toHaveBeenCalled()
    })

    it('should return 404 for unknown endpoints', async () => {
      const request = new Request('http://localhost/unknown')
      const response = await chatSession.fetch(request)

      expect(response.status).toBe(404)
    })
  })

  describe('Error Handling', () => {
    it('should handle uninitialized chat state', async () => {
      const getMock = mockState.storage.get as Mock
      getMock.mockImplementationOnce(() => null)

      const request = new Request('http://localhost/messages')
      const response = await chatSession.fetch(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual([])
    })

    it('should handle invalid WebSocket message format', async () => {
      const request = new Request('http://localhost', {
        headers: { 'Upgrade': 'websocket' }
      })

      await chatSession.fetch(request)
      const invalidMessage = '{"type":"invalid"}'

      const messageEvent = new MessageEvent('message', { data: invalidMessage })
      await (mockWebSocketPair[1] as WebSocket & { dispatchEvent: Function })
        .dispatchEvent(messageEvent)

      expect(mockWebSocketPair[1].send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"')
      )
    })
  })
})
