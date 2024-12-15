# support-agent
[![npm version](https://badge.fury.io/js/support-agent.svg)](https://badge.fury.io/js/support-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A multi-channel support chatbot powered by Cloudflare Workers, Workers AI, and Vectorize. Handles support requests across Email, Slack, and Web Chat channels with business-specific context isolation.

## Features
- Multi-channel support (Email, Slack, Web Chat)
- RAG-powered responses with business context isolation
- Persona-based response generation (Support, Sales, Billing)
- Error handling with Dead Letter Queue
- Real-time message processing with queues
- TypeScript support with comprehensive type definitions

## Quick Start

```typescript
import { generateResponse } from 'support-agent'

// Initialize RAG pipeline
const response = await generateResponse(
  env.SUPPORT_VECTORIZE,
  env.SUPPORT_AI,
  'How do I reset my password?',
  'business1',
  'support'
)

console.log(response.text)
```

## Channel Examples

### Email Support
```typescript
import { QueueMessage } from 'support-agent'

const emailMessage: QueueMessage = {
  type: 'email',
  businessId: 'business1',
  persona: 'support',
  content: 'Need help with login issues',
  metadata: {
    threadId: 'thread123',
    userId: 'user456',
    timestamp: Date.now()
  }
}

await env.SUPPORT_QUEUE.send(emailMessage)
```

### Slack Integration
```typescript
const slackMessage: QueueMessage = {
  type: 'slack',
  businessId: 'business1',
  persona: 'sales',
  content: 'Interested in enterprise features',
  metadata: {
    channelId: 'C345678',
    threadId: 'T901234',
    userId: 'U789012',
    timestamp: Date.now()
  }
}

await env.SUPPORT_QUEUE.send(slackMessage)
```

### Web Chat Widget
```typescript
const chatMessage: QueueMessage = {
  type: 'chat',
  businessId: 'business1',
  persona: 'support',
  content: 'Hello, I need help with API integration',
  metadata: {
    threadId: 'session789',
    userId: 'visitor123',
    timestamp: Date.now()
  }
}

await env.SUPPORT_QUEUE.send(chatMessage)
```

## Configuration

### Vector Store
```typescript
const vectorizeConfig = {
  dimensions: 384,
  metric: 'cosine',
  format: 'float32'
}
```

### Persona Settings
```typescript
const personaConfig = {
  support: {
    prompt: 'You are a helpful support agent...',
    context_length: 5,
    temperature: 0.7
  },
  sales: {
    prompt: 'You are a knowledgeable sales agent...',
    context_length: 3,
    temperature: 0.8
  }
}
```

### Queue Configuration
```typescript
const queueConfig = {
  support: {
    max_retries: 3,
    backoff: {
      type: 'exponential',
      min_delay: 1000,
      max_delay: 60000
    }
  },
  dlq: {
    retention_period: 7 * 24 * 60 * 60 // 7 days
  }
}
```

## Error Handling

The system includes comprehensive error handling with Dead Letter Queue support:

```typescript
try {
  const response = await generateResponse(
    vectorizeIndex,
    ai,
    'Query with no matching context',
    'non_existent_business',
    'support'
  )
} catch (error) {
  if (error instanceof Error) {
    console.log('Error handled:', error.message)
  }
}
```

## Dependencies
- @cloudflare/workers-types
- hono
- @hono/cloudflare-workers
- @cloudflare/ai
