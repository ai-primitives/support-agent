import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageConsumer } from '../../src/queues/consumer'
import { RAGService } from '../../src/services/rag'
import type { Message, MessageBatch } from '../../src/queues/types'

describe('MessageConsumer', () => {
  let messageConsumer: MessageConsumer
  let mockRagService: any
  let mockQueue: any
  let mockDlq: any

  beforeEach(() => {
    mockRagService = {
      generateResponse: vi.fn().mockResolvedValue('AI response')
    }

    mockQueue = {
      send: vi.fn().mockResolvedValue(undefined)
    }

    mockDlq = {
      send: vi.fn().mockResolvedValue(undefined)
    }

    messageConsumer = new MessageConsumer(mockRagService, mockQueue, mockDlq)
  })

  describe('processMessage', () => {
    it('should process messages and generate responses', async () => {
      const message: Message = {
        id: crypto.randomUUID(),
        business_id: crypto.randomUUID(),
        channel: 'chat',
        content: 'test message',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const batch: MessageBatch = {
        messages: [{
          body: { message, retries: 0 },
          ack: vi.fn()
        }]
      }

      await messageConsumer.processMessage(batch)

      expect(mockRagService.generateResponse).toHaveBeenCalledWith(
        message.content,
        message.business_id,
        undefined
      )
      expect(batch.messages[0].ack).toHaveBeenCalled()
    })

    it('should retry failed messages up to 3 times', async () => {
      const message: Message = {
        id: crypto.randomUUID(),
        business_id: crypto.randomUUID(),
        channel: 'chat',
        content: 'test message',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockRagService.generateResponse.mockRejectedValue(new Error('Test error'))

      const batch: MessageBatch = {
        messages: [{
          body: { message, retries: 2 },
          ack: vi.fn()
        }]
      }

      await messageConsumer.processMessage(batch)

      expect(mockDlq.send).toHaveBeenCalledWith({
        message: batch.messages[0].body,
        error: 'Test error'
      })
      expect(batch.messages[0].ack).toHaveBeenCalled()
    })
  })
})
