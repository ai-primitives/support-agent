import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      modules: true,
      bindings: {
        DB: {},
        VECTORIZE_INDEX: {},
        AI: {},
        MESSAGE_QUEUE: 'Queue',
        DLQ: 'Queue',
        CHAT_SESSIONS: {
          className: 'ChatSession',
          scriptName: 'worker'
        }
      },
      durableObjects: {
        CHAT_SESSIONS: 'ChatSession'
      },
      scriptPath: 'dist/worker.js',
      buildCommand: 'npm run build',
      wranglerConfigPath: 'wrangler.toml',
      compatibilityFlags: ['nodejs_compat', 'experimental'],
      compatibilityDate: '2024-01-01',
      kvNamespaces: ['TEST_KV']
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: ['src/tests/setup.ts'],
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },
    alias: {
      '@cloudflare/ai': path.resolve(__dirname, './src/tests/mocks/@cloudflare/ai.ts')
    }
  }
})
