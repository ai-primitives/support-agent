import { z } from 'zod'

export const MessageSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  channel: z.enum(['email', 'slack', 'chat']),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  persona_id: z.string().uuid().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export type Message = z.infer<typeof MessageSchema>

export const MessageQueueSchema = z.object({
  message: MessageSchema,
  retries: z.number().int().min(0).max(3).default(0)
})

export type MessageQueuePayload = z.infer<typeof MessageQueueSchema>

export interface MessageBatch {
  messages: {
    body: MessageQueuePayload
    ack: () => void
  }[]
}
