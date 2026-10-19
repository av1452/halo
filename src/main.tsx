import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme } from './design-system/theme'
import { themeStore } from './design-system/themeStore'

// Apply before first render so there is no flash of the wrong theme
applyTheme(themeStore.get(), window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
