import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      modules: true,
      bindings: {
        // Add mock bindings for testing
        DB: {},
        VECTORIZE_INDEX: {},
        AI: {}
      }
    },
    testTimeout: 60000, // 60 second timeout for tests
    hookTimeout: 60000, // 60 second timeout for hooks
    setupFiles: ['test/setup.ts']
  }
})
