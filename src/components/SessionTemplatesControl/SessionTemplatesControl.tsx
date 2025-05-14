import React from 'react'
import { DEFAULT_SESSION_TEMPLATES } from '../../utils/CONSTANTS/SessionTemplates'
import Button from '../Button/Button'
import './SessionTemplatesControl.scss'

export default function SessionTemplatesControl() {
  return (
    <div className="session_templates_control">
      {DEFAULT_SESSION_TEMPLATES.map((template) => (
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