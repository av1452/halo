import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, DEFAULT_THEME } from './design-system/theme'

applyTheme(DEFAULT_THEME, window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
