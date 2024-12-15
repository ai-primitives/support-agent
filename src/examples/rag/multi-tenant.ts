import { VectorizeIndex, Ai } from '@cloudflare/workers-types'
import { generateResponse } from '../../worker'

/**
 * Multi-tenant RAG example showing business isolation and persona handling
 */
export const multiTenantExample = async (
  vectorizeIndex: VectorizeIndex,
  ai: Ai
) => {
  // Example 1: Different businesses, same query
  const business1Response = await generateResponse(
    vectorizeIndex,
    ai,
    'Tell me about your pricing',
    'business1',
    'sales'
  )
  console.log('Business 1 Response:', business1Response)

  const business2Response = await generateResponse(
    vectorizeIndex,
    ai,
    'Tell me about your pricing',
    'business2',
    'sales'
  )
  console.log('Business 2 Response:', business2Response)

  // Example 2: Same business, different personas
  const supportResponse = await generateResponse(
    vectorizeIndex,
    ai,
    'How can I help with account setup?',
    'business1',
    'support'
  )
  console.log('Support Response:', supportResponse)

  const salesResponse = await generateResponse(
    vectorizeIndex,
    ai,
    'How can I help with account setup?',
    'business1',
    'sales'
  )
  console.log('Sales Response:', salesResponse)

  return {
    business1Response,
    business2Response,
    supportResponse,
    salesResponse
  }
}
