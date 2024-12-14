import React, { useState, useEffect, useCallback } from 'react'
import type { MessagePayload } from '../../types/workflow'

interface ChatWidgetProps {
  businessId: string
  apiUrl: string
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
  }
}

interface Message {
  id: string
  type: 'user' | 'agent'
  content: string
  timestamp: string
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ businessId, apiUrl, theme = {} }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [conversationId] = useState(() => crypto.randomUUID())
  const [socket, setSocket] = useState<WebSocket | null>(null)

  const {
    primaryColor = '#0070f3',
    backgroundColor = '#ffffff',
    textColor = '#000000'
  } = theme

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const message: MessagePayload = {
      type: 'chat',
      businessId,
      conversationId,
      content,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }

    try {
      const response = await fetch(`${apiUrl}/api/businesses/${businessId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'user',
          content,
          timestamp: new Date().toISOString()
        }
      ])
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [apiUrl, businessId, conversationId])

  useEffect(() => {
    const ws = new WebSocket(`${apiUrl.replace('http', 'ws')}/ws/${businessId}/${conversationId}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'agent',
          content: data.content,
          timestamp: new Date().toISOString()
        }
      ])
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    setSocket(ws)

    return () => {
      ws.close()
    }
  }, [apiUrl, businessId, conversationId])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        height: '500px',
        backgroundColor,
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          padding: '15px',
          backgroundColor: primaryColor,
          color: '#ffffff'
        }}
      >
        Support Chat
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px'
        }}
      >
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              marginBottom: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                backgroundColor: message.type === 'user' ? primaryColor : '#f0f0f0',
                color: message.type === 'user' ? '#ffffff' : textColor,
                padding: '8px 12px',
                borderRadius: '15px',
                maxWidth: '80%',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </div>
            <small
              style={{
                color: '#666',
                fontSize: '0.8em',
                marginTop: '4px'
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '15px',
          borderTop: '1px solid #eee'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '10px'
          }}
        >
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder='Type your message...'
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '20px',
              border: '1px solid #ddd',
              outline: 'none'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            style={{
              backgroundColor: primaryColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
