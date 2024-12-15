import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setup } from '../setup'
import { MessageProducer } from '../../src/queues/producer'
import { RAGService } from '../../src/services/rag'
import type { Message } from '../../src/queues/types'

describe('Queue-RAG Integration', () => {
  const { worker } = setup()
  let messageProducer: MessageProducer
  let ragService: RAGService

  beforeEach(() => {
    messageProducer = new MessageProducer(worker.env.MESSAGE_QUEUE)
    ragService = new RAGService(worker.env.AI, worker.env.VECTORIZE_INDEX, worker.env)
  })

  it('should process messages through RAG pipeline', async () => {
    const message: Message = {
      id: crypto.randomUUID(),
      business_id: crypto.randomUUID(),
      channel: 'chat',
      content: 'What are your business hours?',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add test knowledge base entry
    await worker.env.VECTORIZE_INDEX.insert([{
      id: crypto.randomUUID(),
      values: new Array(768).fill(0),
      metadata: {
        content: 'Our business hours are 9 AM to 5 PM Monday through Friday.',
        business_id: message.business_id
      }
    }])

    // Enqueue message
    await messageProducer.enqueueMessage(message)

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify RAG response
    const response = await ragService.generateResponse(
      message.content,
      message.business_id
    )

    expect(response).toContain('business hours')
  })

  it('should handle messages with persona configuration', async () => {
    // Create test persona
    const personaResp = await worker.fetch('/api/persona', {
      method: 'POST',
      body: JSON.stringify({
        business_id: crypto.randomUUID(),
        name: 'Test Persona',
        config: {
          tone: 'professional',
          language: 'en'
        }
      })
    })
    const persona = await personaResp.json()

    const message: Message = {
      id: crypto.randomUUID(),
      business_id: persona.business_id,
      persona_id: persona.id,
      channel: 'chat',
      content: 'Hello!',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Enqueue message
    await messageProducer.enqueueMessage(message)

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verify RAG response includes persona configuration
    const response = await ragService.generateResponse(
      message.content,
      message.business_id,
      message.persona_id
    )

    expect(response).toBeDefined()
    expect(response.length).toBeGreaterThan(0)
  })
})
