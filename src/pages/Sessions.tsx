import React, { useState, useEffect } from 'react'
import SessionTemplatesControl from '../components/SessionTemplatesControl/SessionTemplatesControl'
import { SessionTemplate } from '../types/Session'
import Navbar from '../components/Navbar/Navbar'
import './Sessions.scss'

export default function Sessions() {
  const [customTemplates, setCustomTemplates] = useState<SessionTemplate[]>([])
  const [name, setName] = useState('')
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)

  useEffect(() => {
    chrome.storage.local.get('customSessionTemplates', (data: any) => {
      setCustomTemplates(data.customSessionTemplates || [])
    })
  }, [])

  const handleCreate = () => {
    if (!name.trim()) return
    const id = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    const newTemplate: SessionTemplate = { id, name, workMinutes, breakMinutes }
    const updated = [...customTemplates, newTemplate]
    chrome.storage.local.set({ customSessionTemplates: updated })
    setCustomTemplates(updated)
    setName('')
    setWorkMinutes(25)
    setBreakMinutes(5)
  }

  return (
    <div className="sessions_page">
      <Navbar text="Sessions" isFocused={true}></Navbar>
      <SessionTemplatesControl />
      <div className="sessions_page__custom">
        <h3>Create Custom Session</h3>
        <input
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Work (min)"
          value={workMinutes}
          onChange={e => setWorkMinutes(parseInt(e.target.value) || 0)}
        />
        <input
          type="number"
          placeholder="Break (min)"
          value={breakMinutes}
          onChange={e => setBreakMinutes(parseInt(e.target.value) || 0)}
        />
        <button onClick={handleCreate}>Create</button>
      </div>
    </div>
  )
} 