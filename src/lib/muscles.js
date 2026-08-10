export const MUSCLE_GROUPS = [
  { id: 'chest', color: '#ff6b6b' },
  { id: 'back', color: '#4ecdc4' },
  { id: 'shoulders', color: '#ffd93d' },
  { id: 'biceps', color: '#6bcb77' },
  { id: 'triceps', color: '#4d96ff' },
  { id: 'legs', color: '#c084fc' },
  { id: 'glutes', color: '#f472b6' },
  { id: 'core', color: '#fb923c' },
  { id: 'cardio', color: '#38bdf8' },
]

export function getMuscleColor(id) {
  return MUSCLE_GROUPS.find((m) => m.id === id)?.color ?? '#888'
}
