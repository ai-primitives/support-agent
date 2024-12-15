export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Business {
  id: string
  name: string
  settings: Record<string, any>
}

export interface CustomerPersona {
  id: string
  businessId: string
  name: string
  traits: Record<string, any>
}
