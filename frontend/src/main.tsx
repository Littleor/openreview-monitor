import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { I18nProvider } from './lib/i18n'
import './index.css'

const analyticsSrc = import.meta.env.VITE_ANALYTICS_SRC?.trim()
if (analyticsSrc && typeof document !== 'undefined') {
  const existing = document.querySelector(
    'script[data-analytics="env"]',
  ) as HTMLScriptElement | null
  if (!existing) {
    const script = document.createElement('script')
    script.async = true
    script.src = analyticsSrc
    script.dataset.analytics = 'env'
    document.head.appendChild(script)
  } else if (existing.getAttribute('src') !== analyticsSrc) {
    existing.setAttribute('src', analyticsSrc)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
)
