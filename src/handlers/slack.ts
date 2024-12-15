import { Env } from '../bindings';
import { handleRagQuery } from '../services/rag';

interface SlackMessage {
  channel: string;
  user: string;
  text: string;
  thread_ts?: string;
}

export async function handleSlack(message: SlackMessage, env: Env): Promise<void> {
  try {
    // Extract content from Slack message
    const { channel, user, text, thread_ts } = message;

    // Process query through RAG service
    const response = await handleRagQuery(text, env);

    // Prepare Slack response
    const replyMessage = {
      type: 'slack' as const,
      businessId: 'test-business', // In production, this would be determined from the channel or workspace
      slack: {
        channel,
        text: response,
        thread_ts: thread_ts, // Reply in thread if it exists
        user: user // For @mentions
      }
    };

    // In local mode, just log the response
    if (env.LOCAL_MODE) {
      console.log('Slack Response:', replyMessage);
      return;
    }

    // In production, send through Cloudflare Queue
    await env.MESSAGE_QUEUE.send(replyMessage);

  } catch (error) {
    console.error('Error handling Slack message:', error);
    throw error;
  }
}
