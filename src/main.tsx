import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@ui/App.tsx'
import { I18nProvider } from '@ui/i18n/index.ts'

import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
