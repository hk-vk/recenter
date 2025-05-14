export interface SessionTemplate {
  id: string
  name: string
  workMinutes: number
  breakMinutes: number
  description?: string
  cycles: number
}

export interface ActiveSessionState {
  templateId: string
  currentPhase: 'work' | 'break'
  phaseKey: string
  phaseEndTime: number
  isPaused: boolean
  pausedTimeRemainingMs?: number
  currentCycle: number
  totalCycles: number
} 