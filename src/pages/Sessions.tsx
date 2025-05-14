import React, { useState, useEffect } from 'react'
import SessionTemplatesControl from '../components/SessionTemplatesControl/SessionTemplatesControl'
import { SessionTemplate } from '../types/Session'
import Navbar from '../components/Navbar/Navbar'
import Button from '../components/Button/Button'
import './Sessions.scss'

interface SessionsProps {
  isFocused: boolean
}

export default function Sessions({ isFocused }: SessionsProps) {
  const [customTemplates, setCustomTemplates] = useState<SessionTemplate[]>([])
  const [name, setName] = useState('')
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [cycles, setCycles] = useState(1)
  const [saveTemplate, setSaveTemplate] = useState(false)

  useEffect(() => {
    chrome.storage.local.get('customSessionTemplates', (data: any) => {
      setCustomTemplates(data.customSessionTemplates || [])
    })
  }, [])

  const handleStartCustomSession = () => {
    if (!name.trim()) return
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const newTemplate: SessionTemplate = { 
      id, 
      name, 
      workMinutes, 
      breakMinutes,
      cycles 
    }
    
    chrome.runtime.sendMessage({ 
      type: 'START_SESSION', 
      templateId: id, 
      template: newTemplate 
    })
    
    if (saveTemplate) {
      const updated = [...customTemplates, newTemplate]
      chrome.storage.local.set({ customSessionTemplates: updated })
      setCustomTemplates(updated)
    }
    
    setName('')
    setWorkMinutes(25)
    setBreakMinutes(5)
    setCycles(1)
    setSaveTemplate(false)
  }

  return (
    <div className="sessions_page">
      <Navbar text="Sessions" isFocused={isFocused} />
      <div className="sessions_page__templates">
        <SessionTemplatesControl />
        <div className="sessions_page__custom">
          <h3>Start a Custom Session</h3>
          <input
            type="text"
            placeholder="Session Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="sessions_page__custom_input_group">
            <label htmlFor="workMinutes">Work Minutes</label>
            <input
              id="workMinutes"
              type="number"
              min="1"
              value={workMinutes}
              onChange={e => setWorkMinutes(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="sessions_page__custom_input_group">
            <label htmlFor="breakMinutes">Break Minutes</label>
            <input
              id="breakMinutes"
              type="number"
              min="1"
              value={breakMinutes}
              onChange={e => setBreakMinutes(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="sessions_page__custom_input_group">
            <label htmlFor="cycles">Number of Cycles</label>
            <input
              id="cycles"
              type="number"
              min="1"
              value={cycles}
              onChange={e => setCycles(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="sessions_page__custom_checkbox">
            <input 
              type="checkbox" 
              id="saveTemplate"
              checked={saveTemplate}
              onChange={e => setSaveTemplate(e.target.checked)}
            />
            <label htmlFor="saveTemplate">Save as template</label>
          </div>
          <Button text="Start Session" onClick={handleStartCustomSession} />
        </div>
      </div>
    </div>
  )
} 