import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createVectorizeService } from '../services/vectorize.js'
import type { Env } from '../types.js'

const router = new Hono<{ Bindings: Env }>()

const createEntrySchema = z.object({
  business_id: z.string().uuid(),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).default({})
})

router.post('/', zValidator('json', createEntrySchema), async (c) => {
  const data = c.req.valid('json')
  const id = crypto.randomUUID()
  const vectorizeService = createVectorizeService(c.env)

  try {
    // Generate embedding and store in Vectorize
    const embedding_id = await vectorizeService.addEntry(data.content, {
      business_id: data.business_id,
      ...data.metadata
    })

    // Store entry in database
    await c.env.DB.prepare(
      'INSERT INTO knowledge_base_entries (id, business_id, content, metadata, embedding_id) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, data.business_id, data.content, JSON.stringify(data.metadata), embedding_id)
    .run()

    return c.json({ id, embedding_id, ...data }, 201)
  } catch (error) {
    console.error('Error creating knowledge base entry:', error)
    return c.json({ error: 'Failed to create knowledge base entry' }, 500)
  }
})

router.get('/:id', async (c) => {
  const { id } = c.req.param()

  const entry = await c.env.DB.prepare(
    'SELECT * FROM knowledge_base_entries WHERE id = ?'
  )
  .bind(id)
  .first()

  if (!entry) {
    return c.json({ error: 'Entry not found' }, 404)
  }

  return c.json(entry)
})

export { router as knowledgeBaseRoutes }
