import { Env } from '../bindings'

export interface MessageOptions {
  type: 'email' | 'slack' | 'chat'
  businessId: string
  conversationId: string
  content: string
  metadata?: Record<string, unknown>
}

export class MessageService {
  constructor(private env: Env) {}

  async sendMessage(options: MessageOptions): Promise<void> {
    if (!options.content.trim()) {
      throw new Error('Message content cannot be empty')
    }

    try {
      await this.env.MESSAGE_QUEUE.send({
        type: options.type,
        businessId: options.businessId,
        conversationId: options.conversationId,
        content: options.content,
        metadata: options.metadata
      })
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
