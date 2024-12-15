import { VectorizeIndex, Ai } from '@cloudflare/workers-types'
import { generateResponse } from '../../worker'

/**
 * Basic RAG example demonstrating simple query-response functionality
 */
export const basicRagExample = async (
  vectorizeIndex: VectorizeIndex,
  ai: Ai,
  businessId = 'business1',
  persona = 'support'
) => {
  // Example 1: Basic support query
  const passwordResetResponse = await generateResponse(
    vectorizeIndex,
    ai,
    'How do I reset my password?',
    businessId,
    persona
  )
  console.log('Password Reset Response:', passwordResetResponse)

  // Example 2: Product information query
  const productResponse = await generateResponse(
    vectorizeIndex,
    ai,
    'What are the system requirements?',
    businessId,
    persona
  )
  console.log('Product Info Response:', productResponse)

  return { passwordResetResponse, productResponse }
}
