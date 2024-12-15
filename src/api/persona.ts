import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../types.js'

const router = new Hono<{ Bindings: Env }>()

const createPersonaSchema = z.object({
  business_id: z.string().uuid(),
  name: z.string().min(1),
  config: z.record(z.unknown()).default({})
})

router.post('/', zValidator('json', createPersonaSchema), async (c) => {
  const data = c.req.valid('json')
  const id = crypto.randomUUID()

  await c.env.DB.prepare(
    'INSERT INTO customer_personas (id, business_id, name, config) VALUES (?, ?, ?, ?)'
  )
  .bind(id, data.business_id, data.name, JSON.stringify(data.config))
  .run()

  return c.json({ id, ...data }, 201)
})

router.get('/:id', async (c) => {
  const { id } = c.req.param()

  const persona = await c.env.DB.prepare(
    'SELECT * FROM customer_personas WHERE id = ?'
  )
  .bind(id)
  .first()

  if (!persona) {
    return c.json({ error: 'Persona not found' }, 404)
  }

  return c.json(persona)
})

export { router as personaRoutes }
