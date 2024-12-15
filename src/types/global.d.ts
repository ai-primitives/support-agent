declare global {
  interface WebSocketPair {
    0: WebSocket
    1: WebSocket
  }

  const WebSocketPair: {
    new (): WebSocketPair
    prototype: WebSocketPair
  }

  interface WebSocket extends EventTarget {
    accept(): void
    send(data: string): void
    addEventListener(type: string, listener: (event: MessageEvent) => void): void
    removeEventListener(type: string, listener: (event: MessageEvent) => void): void
  }
}

export {}
