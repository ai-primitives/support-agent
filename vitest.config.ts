/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'miniflare',
    environmentOptions: {
      modules: true,
      scriptPath: 'src/worker.ts',
      bindings: {
        SUPPORT_QUEUE: 'Queue',
        DLQ: 'Queue',
        SUPPORT_AI: 'AI',
        SUPPORT_VECTORIZE: 'VectorizeIndex'
      }
    }
  }
})
