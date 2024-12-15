/// <reference types="@cloudflare/workers-types" />

interface MessagePayload {
  type: 'email' | 'slack' | 'chat' | 'knowledge_processed' | 'knowledge_error';
  businessId: string;
  conversationId?: string;
  content?: string;
  status?: 'success' | 'error';
  error?: string;
  metadata?: Record<string, unknown>;
  email?: {
    from: string;
    to: string[];
    subject: string;
    text: string;
    html?: string;
  };
}

interface KnowledgeWorkflowPayload {
  businessId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface Env {
  CHAT_SESSIONS: DurableObjectNamespace;
  VECTORIZE: {
    query(vector: number[], options: {
      topK: number;
      filter?: Record<string, any>;
      returnMetadata?: boolean;
    }): Promise<{
      matches: Array<{
        id: string;
        score: number;
        metadata: Record<string, any>;
      }>;
    }>;
    insert(vectors: Array<{
      id: string;
      values: number[];
      metadata: Record<string, any>;
    }>): Promise<void>;
    upsert(vectors: Array<{
      id: string;
      values: number[];
      metadata: Record<string, any>;
    }>): Promise<void>;
    delete(ids: string[]): Promise<void>;
  };
  AI: {
    run(model: string, inputs: { text: string }): Promise<{
      data: number[][];
    }>;
  };
  MESSAGE_QUEUE: Queue<MessagePayload>;
  KNOWLEDGE_WORKFLOW: WorkflowNamespace;
  LOCAL_MODE?: boolean;
}
