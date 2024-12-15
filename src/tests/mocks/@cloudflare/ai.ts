// Mock implementation of @cloudflare/ai
export class Ai {
  async run(model: string, inputs: any) {
    return { response: 'Mocked AI response' }
  }

  async prepare(model: string, inputs: any) {
    return { response: 'Mocked preparation' }
  }
}
