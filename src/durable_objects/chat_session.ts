/// <reference types="@cloudflare/workers-types" />

import { Message, Business, CustomerPersona } from '../models/types'

interface ChatState {
  businessId: string
  personaId: string
  messages: Message[]
  metadata: Record<string, unknown>
}

interface WebSocketMessage {
  type: 'message' | 'metadata'
  messageId?: string
  businessId?: string
  personaId?: string
  message?: string
  metadata?: Record<string, unknown>
}

export class ChatSession implements DurableObject {
  private state: DurableObjectState
  private chatState: ChatState | null = null
  private webSocket: WebSocket | null = null

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async initialize(businessId: string, personaId: string): Promise<void> {
    this.chatState = {
      businessId,
      personaId,
      messages: [],
      metadata: {}
    }
    await this.state.storage.put('chatState', this.chatState)
  }

  private async handleWebSocketMessage(message: string): Promise<void> {
    try {
      const data = JSON.parse(message) as WebSocketMessage

      if (!this.chatState && data.businessId && data.personaId) {
        await this.initialize(data.businessId, data.personaId)
      }

      if (!this.chatState) {
        throw new Error('Chat session not initialized')
      }

      switch (data.type) {
        case 'message':
          if (!data.message) throw new Error('Message content required')
          this.chatState.messages.push({
            role: 'user',
            content: data.message,
            timestamp: new Date().toISOString()
          })
          break

        case 'metadata':
          if (!data.metadata) throw new Error('Metadata required')
          this.chatState.metadata = {
            ...this.chatState.metadata,
            ...data.metadata
          }
          break

        default:
          throw new Error('Invalid message type')
      }

      await this.state.storage.put('chatState', this.chatState)

      if (this.webSocket && data.messageId) {
        this.webSocket.send(JSON.stringify({
          type: 'ack',
          messageId: data.messageId
        }))
      }
    } catch (error) {
      if (this.webSocket) {
        this.webSocket.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      this.webSocket = server
      server.accept()

      server.addEventListener('message', async (event) => {
        await this.handleWebSocketMessage(event.data as string)
      })

      server.addEventListener('close', () => {
        this.webSocket = null
      })

      return new Response(null, {
        status: 101,
        webSocket: client as unknown as WebSocket
      })
    }

    // Handle HTTP requests
    switch (url.pathname) {
      case '/messages':
        return new Response(JSON.stringify(this.chatState?.messages || []), {
          headers: { 'Content-Type': 'application/json' }
        })

      case '/metadata':
        if (request.method === 'PUT') {
          const metadata = await request.json() as Record<string, unknown>
          if (this.chatState) {
            this.chatState.metadata = { ...this.chatState.metadata, ...metadata }
            await this.state.storage.put('chatState', this.chatState)
          }
          return new Response(JSON.stringify({ success: true }))
        }
        return new Response(JSON.stringify(this.chatState?.metadata || {}), {
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return new Response('Not found', { status: 404 })
    }
  }
}
