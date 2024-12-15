/**
 * Persona configuration examples
 */
export const personaConfig = {
  support: {
    prompt: 'You are a helpful support agent. Focus on resolving technical issues and providing clear step-by-step guidance.',
    context_length: 5,
    temperature: 0.7,
    response_format: {
      type: 'markdown',
      include_metadata: true
    }
  },
  sales: {
    prompt: 'You are a knowledgeable sales agent. Focus on understanding customer needs and explaining product benefits.',
    context_length: 3,
    temperature: 0.8,
    response_format: {
      type: 'markdown',
      include_metadata: true
    }
  },
  billing: {
    prompt: 'You are a billing support specialist. Help customers understand their invoices and resolve payment issues.',
    context_length: 4,
    temperature: 0.6,
    response_format: {
      type: 'markdown',
      include_metadata: true
    }
  }
}

/**
 * Example persona selection logic
 */
export const selectPersona = (
  intent: string,
  businessId: string
): keyof typeof personaConfig => {
  // Simple intent-based routing
  if (intent.toLowerCase().includes('price') || intent.toLowerCase().includes('cost')) {
    return 'sales'
  }
  if (intent.toLowerCase().includes('bill') || intent.toLowerCase().includes('payment')) {
    return 'billing'
  }
  return 'support'
}
