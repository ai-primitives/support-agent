import { Hono } from 'hono'
import { db } from '../../services/db'
import { conversations, messages } from '../../models/schema'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

export const chatRouter = new Hono()

// Create new conversation
chatRouter.post('/conversation', async (c) => {
  const body = await c.req.json()
  const { businessId, personaId, channel } = body

  const conversation = await db.insert(conversations).values({
    businessId,
    personaId,
    channel
  }).returning()

  return c.json(conversation[0])
})

// Send message in conversation
chatRouter.post('/message', async (c) => {
  const body = await c.req.json()
  const { conversationId, content } = body

  // Store user message
  const userMessage = await db.insert(messages).values({
    conversationId,
    role: 'user',
    content
  }).returning()

  // Generate embeddings for RAG
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: content
  })

  // TODO: Implement Vectorize search and RAG response generation

  // Store assistant message (placeholder)
  const assistantMessage = await db.insert(messages).values({
    conversationId,
    role: 'assistant',
    content: 'Placeholder response'
  }).returning()

  return c.json({
    userMessage: userMessage[0],
    assistantMessage: assistantMessage[0]
  })
})

// Get conversation history
chatRouter.get('/history/:conversationId', async (c) => {
  const conversationId = c.req.param('conversationId')

  const messageHistory = await db.select()
    .from(messages)
    .where(messages.conversationId.equals(conversationId))
    .orderBy(messages.createdAt)

  return c.json(messageHistory)
})
