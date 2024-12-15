import { MessageQueueSchema, type Message } from './types'
import type { Env } from '../types'

export class MessageProducer {
  constructor(private queue: Env['MESSAGE_QUEUE']) {}

  async enqueueMessage(message: Message): Promise<void> {
    const payload = MessageQueueSchema.parse({
      message,
      retries: 0
    })

    await this.queue.send(payload)
  }
}

export const createMessageProducer = (env: Env): MessageProducer => {
  return new MessageProducer(env.MESSAGE_QUEUE)
}
