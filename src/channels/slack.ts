import type { Message } from '../queues/types'

export class SlackChannel {
  async sendMessage(message: Message, response: string): Promise<void> {
    // TODO: Implement Slack message sending
    throw new Error('Slack channel not implemented')
  }
}
