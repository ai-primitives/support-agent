import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../types.js'

const router = new Hono<{ Bindings: Env }>()

const createBusinessSchema = z.object({
  name: z.string().min(1),
  config: z.object({
    theme: z.string(),
    language: z.string()
  }).default({ theme: 'light', language: 'en' })
})

router.post('/', zValidator('json', createBusinessSchema), async (c) => {
  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    'INSERT INTO business_profiles (id, name, config) VALUES (?, ?, ?)'
  )
  .bind(id, data.name, JSON.stringify(data.config))
  .run()

  // Fetch the created record to include timestamps
  const business = await c.env.DB.prepare(
    'SELECT id, name, config, created_at, updated_at FROM business_profiles WHERE id = ?'
  )
  .bind(id)
  .first()

  if (!business) {
    return c.json({ error: 'Failed to create business profile' }, 500)
  }

  // Parse the config JSON string and construct response
  const response = {
    id: business.id,
    name: business.name,
    config: JSON.parse(business.config as string),
    created_at: business.created_at,
    updated_at: business.updated_at
  }

  return c.json(response, 201)
})

router.get('/:id', async (c) => {
  const { id } = c.req.param()

  const business = await c.env.DB.prepare(
    'SELECT id, name, config, created_at, updated_at FROM business_profiles WHERE id = ?'
  )
  .bind(id)
  .first()

  if (!business) {
    return c.json({ error: 'Business not found' }, 404)
  }

  // Parse the config JSON string and construct response
  const response = {
    id: business.id,
    name: business.name,
    config: JSON.parse(business.config as string),
    created_at: business.created_at,
    updated_at: business.updated_at
  }

  return c.json(response)
})

export { router as businessRoutes }
