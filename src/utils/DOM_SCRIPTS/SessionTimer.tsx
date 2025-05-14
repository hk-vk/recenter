import React from 'react'
import ReactDOM from 'react-dom/client'
import SessionOverlay from '../../components/SessionOverlay/SessionOverlay'

export function insertSessionTimer() {
  if (document.getElementById('recenter-session-overlay-root')) return

  const rootElement = document.createElement('div')
  rootElement.id = 'recenter-session-overlay-root'
  document.body.appendChild(rootElement)
  
  const reactRoot = ReactDOM.createRoot(rootElement)
  reactRoot.render(
    <React.StrictMode>
      <SessionOverlay />
    </React.StrictMode>
  )
}

export function removeSessionTimer() {
  const rootElement = document.getElementById('recenter-session-overlay-root')
  if (rootElement) {
    rootElement.remove()
  }
} 