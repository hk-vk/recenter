import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { ActiveSessionState } from '../../types/Session'
import './SessionTimer.scss'

function OnPageSessionTimer() {
  const [session, setSession] = useState<ActiveSessionState | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    chrome.storage.local.get('activeSession', (data: any) => {
      const state = data.activeSession as ActiveSessionState | null
      setSession(state)
      if (state && !state.isPaused) {
        updateRemaining(state.phaseEndTime)
      }
    })

    const onStorageChange = (changes: any) => {
      if (changes.activeSession) {
        const newState = changes.activeSession.newValue as ActiveSessionState | null
        if (newState && !newState.isPaused) {
          setSession(newState)
          updateRemaining(newState.phaseEndTime)
        } else {
          removeSessionTimer()
        }
      }
    }

    chrome.storage.onChanged.addListener(onStorageChange)

    const interval = setInterval(() => {
      if (session && !session.isPaused) {
        updateRemaining(session.phaseEndTime)
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      chrome.storage.onChanged.removeListener(onStorageChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const updateRemaining = (phaseEndTime: number) => {
    const diff = phaseEndTime - Date.now()
    setTimeRemaining(diff > 0 ? diff : 0)
  }

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(minutes)}:${pad(seconds)}`
  }

  if (!session || session.isPaused) return null

  return (
    <div id="recenter_session_timer" className="session_timer">
      <div className="session_timer__phase">
        Current Phase: {session.currentPhase === 'work' ? 'Work' : 'Break'}
      </div>
      <div className="session_timer__countdown">{formatMs(timeRemaining)}</div>
    </div>
  )
}

export function insertSessionTimer() {
  if (document.getElementById('recenter_session_timer')) return
  const root = document.createElement('div')
  root.id = 'recenter_session_timer'
  document.body.appendChild(root)
  const rootDiv = ReactDOM.createRoot(root)
  rootDiv.render(
    <React.StrictMode>
      <OnPageSessionTimer />
    </React.StrictMode>
  )
}

export function removeSessionTimer() {
  const root = document.getElementById('recenter_session_timer')
  if (root) root.remove()
} 