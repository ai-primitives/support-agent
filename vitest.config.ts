import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      modules: true,
      bindings: {
        DB: {
          type: 'd1',
          database: 'TEST_DB'
        }
      },
      d1Databases: ['TEST_DB'],
      d1Persist: true,
      scriptPath: 'src/index.ts'
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    setupFiles: ['test/setup.ts']
  }
})
