import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Punto de entrada de la app: montamos <App /> en el <div id="root"> del
// index.html. StrictMode es solo para dev (avisa de patrones sospechosos).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
