import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.toml'
        }
      }
    }
  }
})
