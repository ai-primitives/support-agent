import { sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

// Business profiles table
export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Customer personas table
export const customerPersonas = pgTable('customer_personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businessProfiles.id).notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businessProfiles.id).notNull(),
  personaId: uuid('persona_id').references(() => customerPersonas.id).notNull(),
  channel: text('channel').notNull(), // 'email', 'slack', or 'chat'
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Knowledge base embeddings table for RAG
export const knowledgeEmbeddings = pgTable('knowledge_embeddings', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').references(() => businessProfiles.id).notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  vectorId: text('vector_id').notNull(), // Reference to Vectorize embedding
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
