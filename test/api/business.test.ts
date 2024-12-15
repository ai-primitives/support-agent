import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup } from '../setup'
import { Unstable_DevWorker } from 'wrangler'

interface BusinessResponse {
  id: string
  name: string
  config: {
    theme: string
    language: string
  }
  created_at: string
  updated_at: string
}

interface ErrorResponse {
  error: string
}

describe('Business API', () => {
  let worker: Unstable_DevWorker

  beforeAll(async () => {
    worker = await setup()
  })

  it('should create a new business profile', async () => {
    const response = await worker.fetch('http://localhost:8787/api/business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Business',
        config: {
          theme: 'light',
          language: 'en'
        }
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json() as BusinessResponse
    expect(data).toMatchObject({
      name: 'Test Business',
      config: {
        theme: 'light',
        language: 'en'
      }
    })
    expect(data.id).toBeDefined()
    expect(data.created_at).toBeDefined()
    expect(data.updated_at).toBeDefined()
  })

  it('should validate required fields', async () => {
    const response = await worker.fetch('http://localhost:8787/api/business', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    expect(response.status).toBe(400)
    const data = await response.json() as ErrorResponse
    expect(data.error).toBeDefined()
  })

  afterAll(async () => {
    await worker.stop()
  })
})
