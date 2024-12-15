import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageProducer } from '../../src/queues/producer'
import type { Message } from '../../src/queues/types'

describe('MessageProducer', () => {
  let messageProducer: MessageProducer
  let mockQueue: any

  beforeEach(() => {
    mockQueue = {
      send: vi.fn().mockResolvedValue(undefined)
    }

    messageProducer = new MessageProducer(mockQueue)
  })

  describe('enqueueMessage', () => {
    it('should enqueue a message with initial retry count', async () => {
      const message: Message = {
        id: crypto.randomUUID(),
        business_id: crypto.randomUUID(),
        channel: 'chat',
        content: 'test message',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await messageProducer.enqueueMessage(message)

      expect(mockQueue.send).toHaveBeenCalledWith({
        message,
        retries: 0
      })
    })

    it('should validate message schema before enqueueing', async () => {
      const invalidMessage = {
        id: 'not-a-uuid',
        content: 'test'
      }

      await expect(
        messageProducer.enqueueMessage(invalidMessage as any)
      ).rejects.toThrow()
    })
  })
})
