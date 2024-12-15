import { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  VECTORIZE_INDEX: any // TODO: Add proper type once available
  ENVIRONMENT: string
  AI: any // TODO: Add proper type for AI binding
}

export interface BusinessProfile {
  id: string
  name: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CustomerPersona {
  id: string
  business_id: string
  name: string
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface KnowledgeBaseEntry {
  id: string
  business_id: string
  content: string
  metadata: Record<string, unknown>
  embedding_id: string | null
  created_at: string
  updated_at: string
}

export interface VectorSearchResult {
  id: string
  score: number
  metadata: {
    content: string
    [key: string]: unknown
  }
}
