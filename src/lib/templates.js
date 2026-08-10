import { EXERCISE_LIBRARY, exerciseLabel } from './exercises'

function sets(n, reps = 10) {
  return Array.from({ length: n }, () => ({ weight: 0, reps, rpe: '' }))
}

function ex(id, n = 3, reps = 10) {
  return { exerciseId: id, setCount: n, reps }
}

export const PROGRAM_TEMPLATES = [
  {
    id: 'push',
    muscles: ['chest', 'shoulders', 'triceps'],
    exercises: [
      ex('bench-press', 4, 8),
      ex('incline-bench', 3, 10),
      ex('ohp', 3, 8),
      ex('lateral-raise', 3, 12),
      ex('tricep-pushdown', 3, 12),
      ex('dip', 3, 10),
    ],
  },
  {
    id: 'pull',
    muscles: ['back', 'biceps'],
    exercises: [
      ex('pull-up', 4, 8),
      ex('barbell-row', 4, 8),
      ex('lat-pulldown', 3, 10),
      ex('face-pull', 3, 15),
      ex('barbell-curl', 3, 10),
      ex('hammer-curl', 3, 12),
    ],
  },
  {
    id: 'legs',
    muscles: ['legs', 'glutes'],
    exercises: [
      ex('squat', 4, 8),
      ex('leg-press', 3, 10),
      ex('romanian-deadlift', 3, 10),
      ex('lunge', 3, 10),
      ex('leg-extension', 3, 12),
      ex('leg-curl', 3, 12),
      ex('calf-raise', 4, 15),
    ],
  },
  {
    id: 'fullbody',
    muscles: ['chest', 'back', 'legs', 'shoulders'],
    exercises: [
      ex('squat', 3, 8),
      ex('bench-press', 3, 8),
      ex('barbell-row', 3, 8),
      ex('ohp', 3, 10),
      ex('deadlift', 2, 5),
      ex('plank', 3, 30),
    ],
  },
  {
    id: 'upper',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    exercises: [
      ex('bench-press', 4, 8),
      ex('barbell-row', 4, 8),
      ex('ohp', 3, 8),
      ex('lat-pulldown', 3, 10),
      ex('dumbbell-curl', 3, 12),
      ex('tricep-pushdown', 3, 12),
    ],
  },
  {
    id: 'lower',
    muscles: ['legs', 'glutes', 'core'],
    exercises: [
      ex('squat', 4, 8),
      ex('romanian-deadlift', 3, 10),
      ex('hip-thrust', 3, 10),
      ex('leg-press', 3, 12),
      ex('lunge', 3, 10),
      ex('calf-raise', 4, 15),
      ex('crunch', 3, 15),
    ],
  },
]

export function templateToSession(template, locale = 'fr') {
  const today = new Date().toISOString().slice(0, 10)
  return {
    date: today,
    muscles: [...template.muscles],
    notes: '',
    exercises: template.exercises.map((e) => {
      const lib = EXERCISE_LIBRARY.find((x) => x.id === e.exerciseId)
      const name = lib ? exerciseLabel(lib, locale) : e.exerciseId
      return {
        name,
        sets: sets(e.setCount, e.reps),
      }
    }),
  }
}

export function getTemplate(id) {
  return PROGRAM_TEMPLATES.find((t) => t.id === id) ?? null
}
