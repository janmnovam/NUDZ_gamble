import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@ui/App.tsx'
import { I18nProvider } from '@ui/i18n/index.ts'

import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/podkova'
import './index.css'

if (import.meta.env.DEV) {
  void import('@/dev/devTools.ts').then(({ install }) => {
    install()
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
