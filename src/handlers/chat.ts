import { Env } from '../bindings';
import { handleRagQuery } from '../services/rag';

interface ChatMessage {
  sessionId: string;
  userId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export async function handleChat(message: ChatMessage, env: Env): Promise<void> {
  try {
    // Extract content from chat message
    const { sessionId, userId, text } = message;

    // Process query through RAG service
    const response = await handleRagQuery(text, env);

    // Prepare chat response
    const replyMessage = {
      type: 'chat' as const,
      businessId: 'test-business', // In production, this would be determined from the session
      chat: {
        sessionId,
        userId,
        text: response,
        timestamp: new Date().toISOString()
      }
    };

    // In local mode, just log the response
    if (env.LOCAL_MODE) {
      console.log('Chat Response:', replyMessage);
      return;
    }

    // In production, send through Cloudflare Queue
    await env.MESSAGE_QUEUE.send(replyMessage);

  } catch (error) {
    console.error('Error handling chat message:', error);
    throw error;
  }
}
