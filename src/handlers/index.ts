import { Context } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../bindings'

const businessSchema = z.object({
  name: z.string(),
  settings: z.record(z.unknown()).optional()
})

const personaSchema = z.object({
  name: z.string(),
  traits: z.record(z.unknown())
})

const knowledgeSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional()
})

type ValidatedContext = Context<{ Bindings: Env }>
type BusinessInput = z.infer<typeof businessSchema>
type PersonaInput = z.infer<typeof personaSchema>
type KnowledgeInput = z.infer<typeof knowledgeSchema>

export const handle = {
  createBusiness: zValidator('json', businessSchema, (async (c: ValidatedContext) => {
    const input = await c.req.json() as BusinessInput
    const data = businessSchema.parse(input)
    const id = crypto.randomUUID()

    // Store business data in Durable Object
    const businessObj = c.env.CHAT_SESSIONS.get(c.env.CHAT_SESSIONS.idFromName(`business:${id}`))
    await businessObj.fetch('https://dummy-url/initialize', {
      method: 'POST',
      body: JSON.stringify({ id, name: data.name, settings: data.settings })
    })

    return c.json({ id, name: data.name, settings: data.settings }, 201)
  }) as any),

  createPersona: zValidator('json', personaSchema, (async (c: ValidatedContext) => {
    const businessId = c.req.param('id')
    const input = await c.req.json() as PersonaInput
    const data = personaSchema.parse(input)
    const id = crypto.randomUUID()

    // Store persona data in Durable Object
    const personaObj = c.env.CHAT_SESSIONS.get(c.env.CHAT_SESSIONS.idFromName(`persona:${id}`))
    await personaObj.fetch('https://dummy-url/initialize', {
      method: 'POST',
      body: JSON.stringify({ id, businessId, name: data.name, traits: data.traits })
    })

    return c.json({ id, businessId, name: data.name, traits: data.traits }, 201)
  }) as any),

  addKnowledge: zValidator('json', knowledgeSchema, (async (c: ValidatedContext) => {
    const businessId = c.req.param('id')
    const input = await c.req.json() as KnowledgeInput
    const data = knowledgeSchema.parse(input)
    const id = crypto.randomUUID()

    // Store knowledge in Vectorize (implementation in next step)
    // For now, just return success
    return c.json({ id, businessId, content: data.content, metadata: data.metadata }, 201)
  }) as any),

  searchKnowledge: async (c: ValidatedContext) => {
    const businessId = c.req.param('id')
    const query = c.req.query('query')

    if (!query) {
      return c.json({ error: 'Query parameter required' }, 400)
    }

    // Search knowledge using Vectorize (implementation in next step)
    // For now, return empty results
    return c.json({ results: [] })
  }
}
