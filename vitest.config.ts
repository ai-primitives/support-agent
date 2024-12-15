import { defineConfig } from 'vitest/config'
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers'

export default defineConfig(
  defineWorkersConfig({
    test: {
      poolOptions: {
        workers: {
          wrangler: {
            configPath: './wrangler.toml'
          }
        }
      },
      environment: 'miniflare',
      environmentOptions: {
        modules: true,
        bindings: {
          ENVIRONMENT: 'test',
          OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key',
          VECTORIZE_INDEX_NAME: 'test-index',
          DB_NAME: 'test-db',
          AI_MODEL: 'test-model',
          VECTORIZE: {
            query: { matches: [] },
            insert: { success: true },
            upsert: { success: true },
            delete: { success: true }
          },
          AI: {
            run: { response: 'test response', text: 'test text' },
            generateEmbeddings: [[0.1, 0.2, 0.3]]
          }
        }
      },
      testTimeout: 60000,
      hookTimeout: 60000,
      setupFiles: ['test/setup.ts']
    }
  })
)
