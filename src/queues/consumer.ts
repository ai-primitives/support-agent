import { RAGService } from '../services/rag'
import { MessageQueueSchema, type MessageBatch } from './types'
import { EmailChannel, SlackChannel, ChatChannel } from '../channels'
import type { Env } from '../types'

export class MessageConsumer {
  private emailChannel: EmailChannel
  private slackChannel: SlackChannel
  private chatChannel: ChatChannel

  constructor(
    private ragService: RAGService,
    private queue: Env['MESSAGE_QUEUE'],
    private dlq: Env['DLQ']
  ) {
    this.emailChannel = new EmailChannel()
    this.slackChannel = new SlackChannel()
    this.chatChannel = new ChatChannel()
  }

  async processMessage(batch: MessageBatch): Promise<void> {
    const messages = batch.messages

    for (const message of messages) {
      try {
        const { message: queueMessage, retries } = MessageQueueSchema.parse(message.body)

        // Generate response using RAG
        const response = await this.ragService.generateResponse(
          queueMessage.content,
          queueMessage.business_id,
          queueMessage.persona_id
        )

        // Route response based on channel
        switch (queueMessage.channel) {
          case 'email':
            await this.emailChannel.sendMessage(queueMessage, response)
            break
          case 'slack':
            await this.slackChannel.sendMessage(queueMessage, response)
            break
          case 'chat':
            await this.chatChannel.sendMessage(queueMessage, response)
            break
        }

        // Acknowledge successful processing
        message.ack()
      } catch (error) {
        const retries = (message.body?.retries || 0) + 1

        if (retries >= 3) {
          // Move to DLQ after max retries
          await this.dlq.send({
            message: message.body,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          message.ack()
        } else {
          // Retry with incremented counter
          await this.queue.send({
            ...message.body,
            retries
          })
          message.ack()
        }
      }
    }
  }
}

export const createMessageConsumer = (env: Env): MessageConsumer => {
  const ragService = new RAGService(env.AI, env.VECTORIZE_INDEX, env)
  return new MessageConsumer(ragService, env.MESSAGE_QUEUE, env.DLQ)
}
