import { Env } from '../bindings';
import { handleRagQuery } from '../services/rag';

interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

export async function handleEmail(message: EmailMessage, env: Env): Promise<void> {
  try {
    // Extract content from email
    const { from, subject, text } = message;

    // Process query through RAG service
    const response = await handleRagQuery(text, env);

    // Prepare email response
    const replyEmail = {
      type: 'email' as const,
      businessId: 'test-business', // In production, this would be determined from the recipient address
      email: {
        from: message.to[0], // Use the support email address
        to: [from],
        subject: `Re: ${subject}`,
        text: response,
        html: `<div>${response.replace(/\n/g, '<br/>')}</div>`
      }
    };

    // In local mode, just log the response
    if (env.LOCAL_MODE) {
      console.log('Email Response:', replyEmail);
      return;
    }

    // In production, send through Cloudflare Email Workers
    await env.MESSAGE_QUEUE.send(replyEmail);

  } catch (error) {
    console.error('Error handling email:', error);
    throw error;
  }
}
