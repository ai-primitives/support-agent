import { VectorizeIndex, Ai } from '@cloudflare/workers-types'
import { generateResponse } from '../../worker'

/**
 * Error handling examples for RAG pipeline
 */
export const errorHandlingExample = async (
  vectorizeIndex: VectorizeIndex,
  ai: Ai
) => {
  try {
    // Example 1: Empty context handling
    const emptyContextResponse = await generateResponse(
      vectorizeIndex,
      ai,
      'Query with no matching context',
      'non_existent_business',
      'support'
    )
    console.log('Should not reach here:', emptyContextResponse)
  } catch (error) {
    if (error instanceof Error) {
      console.log('Empty context error handled:', error.message)
    } else {
      console.log('Empty context error handled: Unknown error')
    }
  }

  try {
    // Example 2: Invalid persona handling
    const invalidPersonaResponse = await generateResponse(
      vectorizeIndex,
      ai,
      'Test query',
      'business1',
      'invalid_persona'
    )
    console.log('Should not reach here:', invalidPersonaResponse)
  } catch (error) {
    if (error instanceof Error) {
      console.log('Invalid persona error handled:', error.message)
    } else {
      console.log('Invalid persona error handled: Unknown error')
    }
  }

  // Example 3: Successful error recovery
  try {
    const recoveryResponse = await generateResponse(
      vectorizeIndex,
      ai,
      'Fallback query',
      'business1',
      'support'
    )
    console.log('Recovery successful:', recoveryResponse)
    return recoveryResponse
  } catch (error) {
    console.error('Recovery failed:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}
