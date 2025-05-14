import React, { useEffect, useState } from 'react'
import './SessionOverlay.scss'
import { ActiveSessionState } from '../../types/Session'

export default function SessionOverlay() {
  const [activeSession, setActiveSession] = useState<ActiveSessionState | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    chrome.storage.local.get('activeSession', (data: any) => {
      setActiveSession(data.activeSession || null)
    })
    const listener = (changes: any, area: string) => {
      if (area === 'local' && changes.activeSession) {
        setActiveSession(changes.activeSession.newValue || null)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return
    const updateRemaining = () => {
      const diff = activeSession.phaseEndTime - Date.now()
      setTimeRemaining(diff > 0 ? diff : 0)
    }
    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)
    return () => clearInterval(interval)
  }, [activeSession])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!activeSession) return null

  return (
    <div className="session_overlay">
      <div className="session_overlay__content">
        <div className="session_overlay__phase">
          Current Phase: {activeSession.currentPhase === 'work' ? 'Work' : 'Break'}
          {activeSession.currentCycle && activeSession.totalCycles && 
            ` (${activeSession.currentCycle}/${activeSession.totalCycles})`}
        </div>
        <div className="session_overlay__timer">
          {formatTime(timeRemaining)}
        </div>
      </div>
    </div>
  )
} 