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
    if (!activeSession || activeSession.isPaused) {
      if (activeSession && activeSession.pausedTimeRemainingMs) {
        setTimeRemaining(activeSession.pausedTimeRemainingMs);
      }
      return;
    }
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

  const handlePauseResume = () => {
    if (!activeSession) return;
    const messageType = activeSession.isPaused ? 'RESUME_SESSION' : 'PAUSE_SESSION';
    chrome.runtime.sendMessage({ type: messageType });
  }

  const handleEndSession = () => {
    chrome.runtime.sendMessage({ type: 'END_SESSION' });
  }

  if (!activeSession) return null

  return (
    <div className="session_overlay__content"> {/* Styles will target this via ID root */}
      <div className="session_overlay__phase">
        Current Phase: {activeSession.currentPhase === 'work' ? 'Work' : 'Break'}
        {activeSession.currentCycle && activeSession.totalCycles && 
          ` (${activeSession.currentCycle}/${activeSession.totalCycles})`}
      </div>
      <div className="session_overlay__timer">
        {formatTime(timeRemaining)}
      </div>
      <div className="session_overlay__controls">
        <button onClick={handlePauseResume} className="session_overlay__button">
          {activeSession.isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={handleEndSession} className="session_overlay__button session_overlay__button--end">
          End Session
        </button>
      </div>
    </div>
  )
} 