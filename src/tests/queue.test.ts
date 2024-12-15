import { describe, it, expect, vi } from 'vitest'
import { QueueMessage, QueueError } from '../queue/types'
import queueConsumer from '../queue/consumer'
import { createMockQueue, createMockAi, createMockVectorizeIndex } from './utils/mocks'

describe('Queue System', () => {
  const mockEnv = {
    SUPPORT_QUEUE: createMockQueue<QueueMessage>(),
    DLQ: createMockQueue<QueueError>(),
    SUPPORT_AI: createMockAi({ response: 'Test response' }),
    SUPPORT_VECTORIZE: createMockVectorizeIndex([
      {
        id: 'doc1',
        score: 0.9,
        metadata: {
          content: 'Test content',
          business_id: 'business1',
          persona: 'support'
        }
      }
    ])
  }

  const createMessage = (type: 'email' | 'slack' | 'chat'): QueueMessage => ({
    type,
    businessId: 'business1',
    persona: 'support',
    content: 'Test message',
    metadata: {
      channelId: 'channel1',
      threadId: 'thread1',
      userId: 'user1',
      timestamp: Date.now()
    }
  })

  it('should process email messages', async () => {
    const batch = {
      messages: [
        {
          body: createMessage('email'),
          ack: vi.fn(),
          retry: vi.fn()
        }
      ]
    }

    await queueConsumer.queue(batch, mockEnv)
    expect(batch.messages[0].ack).toHaveBeenCalled()
    expect(mockEnv.SUPPORT_AI.run).toHaveBeenCalled()
  })

  it('should process slack messages', async () => {
    const batch = {
      messages: [
        {
          body: createMessage('slack'),
          ack: vi.fn(),
          retry: vi.fn()
        }
      ]
    }

    await queueConsumer.queue(batch, mockEnv)
    expect(batch.messages[0].ack).toHaveBeenCalled()
    expect(mockEnv.SUPPORT_AI.run).toHaveBeenCalled()
  })

  it('should handle errors and send to DLQ', async () => {
    const errorEnv = {
      ...mockEnv,
      SUPPORT_AI: createMockAi(Promise.reject(new Error('AI error')))
    }

    const batch = {
      messages: [
        {
          body: createMessage('chat'),
          ack: vi.fn(),
          retry: vi.fn(),
          retryCount: 1
        }
      ]
    }

    await queueConsumer.queue(batch, errorEnv)
    expect(batch.messages[0].retry).toHaveBeenCalled()
    expect(errorEnv.DLQ.sendBatch).toHaveBeenCalled()
  })
})
