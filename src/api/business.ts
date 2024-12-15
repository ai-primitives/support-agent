import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../types.js'

const router = new Hono<{ Bindings: Env }>()

const createBusinessSchema = z.object({
  name: z.string().min(1),
  config: z.record(z.unknown()).default({})
})

router.post('/', zValidator('json', createBusinessSchema), async (c) => {
  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    'INSERT INTO business_profiles (id, name, config) VALUES (?, ?, ?)'
  )
  .bind(id, data.name, JSON.stringify(data.config))
  .run()

  return c.json({ id, ...data }, 201)
})

router.get('/:id', async (c) => {
  const { id } = c.req.param()

  const business = await c.env.DB.prepare(
    'SELECT * FROM business_profiles WHERE id = ?'
  )
  .bind(id)
  .first()

  if (!business) {
    return c.json({ error: 'Business not found' }, 404)
  }

  return c.json(business)
})

export { router as businessRoutes }
