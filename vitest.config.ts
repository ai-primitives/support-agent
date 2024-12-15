import { defineConfig } from 'vitest/config'

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
        DLQ: 'Queue'
      }
    },
    testTimeout: 60000, // 60 second timeout for tests
    hookTimeout: 60000, // 60 second timeout for hooks
    setupFiles: ['test/setup.ts']
  }
})
