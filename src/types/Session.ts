export interface SessionTemplate {
  id: string
  name: string
  workMinutes: number
  breakMinutes: number
  description?: string
}

export interface ActiveSessionState {
  templateId: string
  currentPhase: 'work' | 'break'
  phaseKey: string
  phaseEndTime: number
  isPaused: boolean
  pausedTimeRemainingMs?: number
} 