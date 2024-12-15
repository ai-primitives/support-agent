import { describe, it, expect } from 'vitest'
import { setup } from '../setup.js'

describe('Business API', () => {
  const ctx = setup()

  describe('POST /api/business', () => {
    it('should create a new business profile', async () => {
      const response = await ctx.worker.fetch('/api/business', {
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
      const data = await response.json()
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
      const response = await ctx.worker.fetch('/api/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})
