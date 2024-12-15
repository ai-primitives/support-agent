import type { Message } from '../queues/types'

export class EmailChannel {
  async sendMessage(message: Message, response: string): Promise<void> {
    // TODO: Implement email sending using Email Workers
    throw new Error('Email channel not implemented')
  }
}
