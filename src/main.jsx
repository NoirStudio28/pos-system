import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { POSProvider } from './context/POSContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <POSProvider>
      <App />
    </POSProvider>
  </StrictMode>
)