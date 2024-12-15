import { Context } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { Env } from '../bindings'
import { RAGService } from '../services/rag'
import { MessageService } from '../services/message'
import { handleEmail } from './email'
import { handleSlack } from './slack'
import { handleChat } from './chat'

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

const messageSchema = z.object({
  type: z.enum(['email', 'slack', 'chat']),
  content: z.string(),
  metadata: z.record(z.unknown()).optional()
})

const workflowSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional()
})

type ValidatedContext = Context<{ Bindings: Env }>
type BusinessInput = z.infer<typeof businessSchema>
type PersonaInput = z.infer<typeof personaSchema>
type KnowledgeInput = z.infer<typeof knowledgeSchema>
type MessageInput = z.infer<typeof messageSchema>
type WorkflowInput = z.infer<typeof workflowSchema>

export const handle = {
  // Multi-channel handlers
  handleEmail,
  handleSlack,
  handleChat,

  createBusiness: zValidator('json', businessSchema, (async (c: ValidatedContext) => {
    const input = await c.req.json() as BusinessInput
    const data = businessSchema.parse(input)
    const id = crypto.randomUUID()

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

    const rag = new RAGService(c.env)
    await rag.addKnowledge({
      id,
      businessId,
      content: data.content,
      metadata: data.metadata
    })

    return c.json({ id, businessId, content: data.content, metadata: data.metadata }, 201)
  }) as any),

  searchKnowledge: async (c: ValidatedContext) => {
    const businessId = c.req.param('id')
    const query = c.req.query('query')

    if (!query) {
      return c.json({ error: 'Query parameter required' }, 400)
    }

    const rag = new RAGService(c.env)
    const results = await rag.searchKnowledge(businessId, query)

    return c.json({ results })
  },

  sendMessage: zValidator('json', messageSchema, (async (c: ValidatedContext) => {
    const businessId = c.req.param('id')
    const conversationId = c.req.param('conversationId')
    const input = await c.req.json() as MessageInput
    const data = messageSchema.parse(input)

    const messageService = new MessageService(c.env)
    await messageService.sendMessage({
      type: data.type,
      businessId,
      conversationId,
      content: data.content,
      metadata: data.metadata
    })

    return c.json({ status: 'message queued' }, 202)
  }) as any),

  triggerKnowledgeWorkflow: zValidator('json', workflowSchema, (async (c: ValidatedContext) => {
    const businessId = c.req.param('id')
    const input = await c.req.json() as WorkflowInput
    const data = workflowSchema.parse(input)

    await c.env.KNOWLEDGE_WORKFLOW.dispatch({
      businessId,
      content: data.content,
      metadata: data.metadata
    })

    return c.json({ status: 'workflow triggered' }, 202)
  }) as any)
}
