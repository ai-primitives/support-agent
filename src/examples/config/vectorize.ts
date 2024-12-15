import { VectorizeIndex } from '@cloudflare/workers-types'

/**
 * Vectorize configuration examples
 */
export const vectorizeConfig = {
  // Vector dimensions for bge-small-en model
  dimensions: 384,
  // Similarity metric for vector search
  metric: 'cosine',
  // Vector data format
  format: 'float32'
}

/**
 * Example vector store initialization
 */
export const initializeVectorStore = async (index: VectorizeIndex) => {
  // Example document with business context
  const document = {
    id: 'doc1',
    content: 'How to reset your password: Click the "Forgot Password" link...',
    business_id: 'business1',
    persona: 'support'
  }

  // Insert document into vector store
  await index.insert([{
    id: document.id,
    values: new Float32Array(384), // Replace with actual embedding
    metadata: {
      content: document.content,
      business_id: document.business_id,
      persona: document.persona
    }
  }])

  return document
}
