import { DEFAULT_SESSION_TEMPLATES } from '../CONSTANTS/SessionTemplates'
import { ActiveSessionState } from '../../types/Session'
import { ACTIVE_SESSION_STORAGE_KEY, SESSION_ALARM_NAME } from '../CONSTANTS/SessionConstants'

function getTemplate(templateId: string) {
  const template = DEFAULT_SESSION_TEMPLATES.find((t) => t.id === templateId)
  if (!template) throw new Error(`Session template not found: ${templateId}`)
  return template
}

export async function startSession(templateId: string) {
  const template = getTemplate(templateId)
  const now = Date.now()
  const endTime = now + template.workMinutes * 60 * 1000
  const sessionState: ActiveSessionState = {
    templateId,
    currentPhase: 'work',
    phaseKey: `work-1`,
    phaseEndTime: endTime,
    isPaused: false,
  }
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: sessionState, enableSuperFocusMode: true })
  chrome.alarms.create(SESSION_ALARM_NAME, { when: endTime })
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: sessionState })
}

export async function transitionSessionPhase() {
  const data = await chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY)
  const state: ActiveSessionState = data[ACTIVE_SESSION_STORAGE_KEY]
  if (!state) return
  const template = getTemplate(state.templateId)
  const nextPhase = state.currentPhase === 'work' ? 'break' : 'work'
  const durationMinutes = nextPhase === 'work' ? template.workMinutes : template.breakMinutes
  const now = Date.now()
  const endTime = now + durationMinutes * 60 * 1000
  const newKey = `${nextPhase}-${now}`
  const updatedState: ActiveSessionState = {
    ...state,
    currentPhase: nextPhase,
    phaseKey: newKey,
    phaseEndTime: endTime,
    isPaused: false,
    pausedTimeRemainingMs: undefined,
  }
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: updatedState, enableSuperFocusMode: nextPhase === 'work' })
  chrome.alarms.create(SESSION_ALARM_NAME, { when: endTime })
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: updatedState })
}

export async function pauseSession() {
  const data = await chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY)
  const state: ActiveSessionState = data[ACTIVE_SESSION_STORAGE_KEY]
  if (!state || state.isPaused) return
  chrome.alarms.clear(SESSION_ALARM_NAME)
  const remaining = state.phaseEndTime - Date.now()
  const updatedState: ActiveSessionState = {
    ...state,
    isPaused: true,
    pausedTimeRemainingMs: remaining,
  }
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: updatedState })
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: updatedState })
}

export async function resumeSession() {
  const data = await chrome.storage.local.get(ACTIVE_SESSION_STORAGE_KEY)
  const state: ActiveSessionState = data[ACTIVE_SESSION_STORAGE_KEY]
  if (!state || !state.isPaused || state.pausedTimeRemainingMs == null) return
  const now = Date.now()
  const endTime = now + state.pausedTimeRemainingMs
  const updatedState: ActiveSessionState = {
    ...state,
    isPaused: false,
    phaseEndTime: endTime,
    pausedTimeRemainingMs: undefined,
  }
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: updatedState, enableSuperFocusMode: state.currentPhase === 'work' })
  chrome.alarms.create(SESSION_ALARM_NAME, { when: endTime })
  chrome.runtime.sendMessage({ type: 'SESSION_UPDATED', payload: updatedState })
}

export async function endSession() {
  chrome.alarms.clear(SESSION_ALARM_NAME)
  await chrome.storage.local.set({ [ACTIVE_SESSION_STORAGE_KEY]: null, enableSuperFocusMode: false })
  chrome.runtime.sendMessage({ type: 'SESSION_ENDED' })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'START_SESSION':
      startSession(request.templateId)
      break
    case 'PAUSE_SESSION':
      pauseSession()
      break
    case 'RESUME_SESSION':
      resumeSession()
      break
    case 'END_SESSION':
      endSession()
      break
    default:
      return
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SESSION_ALARM_NAME) {
    transitionSessionPhase()
  }
}) 