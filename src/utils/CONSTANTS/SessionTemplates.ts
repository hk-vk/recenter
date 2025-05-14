import { SessionTemplate } from '../../types/Session'

export const DEFAULT_SESSION_TEMPLATES: SessionTemplate[] = [
  { id: 'pomodoro_25_5', name: 'Pomodoro (25/5)', workMinutes: 25, breakMinutes: 5, description: 'Classic 25 min focus, 5 min break.' },
  { id: 'deep_work_50_10', name: 'Deep Work (50/10)', workMinutes: 50, breakMinutes: 10, description: '50 min intense focus, 10 min break.' },
  { id: 'quick_sprint_15_3', name: 'Quick Sprint (15/3)', workMinutes: 15, breakMinutes: 3, description: 'Short burst of 15 min work, 3 min refresh.' },
] 