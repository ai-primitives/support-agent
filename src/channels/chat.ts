import type { Message } from '../queues/types'

export class ChatChannel {
  async sendMessage(message: Message, response: string): Promise<void> {
    // TODO: Implement chat widget message sending
    throw new Error('Chat channel not implemented')
  }
}
