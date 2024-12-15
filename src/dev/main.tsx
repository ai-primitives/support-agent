import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChatWidget } from '../components/ChatWidget'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChatWidget
      businessId="test-business"
      apiUrl="http://localhost:8787"
      theme={{
        primaryColor: '#0070f3',
        backgroundColor: '#ffffff',
        textColor: '#000000'
      }}
    />
  </React.StrictMode>
)
