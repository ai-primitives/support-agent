import { beforeAll, afterAll, beforeEach } from 'vitest'
import { unstable_dev, type Unstable_DevWorker } from 'wrangler'
import type { Env } from '../src/types.js'

let worker: Unstable_DevWorker

export const setup = () => {
  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
      vars: {
        ENVIRONMENT: 'test',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key'
      },
      local: true,
      persist: false,
      ip: '127.0.0.1',
      localProtocol: 'http'
    })
  }, 35000)

  beforeEach(() => {
    // Reset any test state if needed
  })

  afterAll(async () => {
    if (worker) {
      await worker.stop()
    }
  })

  return { worker }
}
