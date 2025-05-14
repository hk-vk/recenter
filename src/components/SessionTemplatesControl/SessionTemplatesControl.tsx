import React, { useState, useEffect } from 'react'
import { DEFAULT_SESSION_TEMPLATES } from '../../utils/CONSTANTS/SessionTemplates'
import { ActiveSessionState } from '../../types/Session'
import Button from '../Button/Button'
import './SessionTemplatesControl.scss'

export default function SessionTemplatesControl() {
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

  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(minutes)}:${pad(seconds)}`
  }

  const handlePauseResume = () => {
    if (!activeSession) return
    chrome.runtime.sendMessage({ type: activeSession.isPaused ? 'RESUME_SESSION' : 'PAUSE_SESSION' })
  }

  const handleEnd = () => {
    chrome.runtime.sendMessage({ type: 'END_SESSION' })
  }

  if (activeSession) {
    const template = DEFAULT_SESSION_TEMPLATES.find(t => t.id === activeSession.templateId)
    return (
      <div className="session_templates_control">
        <div className="session_templates_control__active">
          <div className="session_templates_control__active__name">{template?.name}</div>
          <div className="session_templates_control__active__phase">
            Phase: {activeSession.currentPhase === 'work' ? 'Work' : 'Break'}
          </div>
          <div className="session_templates_control__active__timer">
            {formatMs(timeRemaining)}
          </div>
          <Button text={activeSession.isPaused ? 'Resume' : 'Pause'} onClick={handlePauseResume} />
          <Button text="End Session" onClick={handleEnd} />
        </div>
      </div>
    )
  }

  return (
    <div className="session_templates_control">
      {DEFAULT_SESSION_TEMPLATES.map(template => (
        <div className="session_templates_control__template" key={template.id}>
          <div className="session_templates_control__template__info">
            <div className="session_templates_control__template__name">{template.name}</div>
            <div className="session_templates_control__template__duration">{template.workMinutes} / {template.breakMinutes}</div>
          </div>
          <Button text="Start" onClick={() => chrome.runtime.sendMessage({ type: 'START_SESSION', templateId: template.id })} />
        </div>
      ))}
    </div>
  )
} 