import { exerciseLabel, getLibraryExercise } from './exercises'

function ex(id, reps = 10) {
  return { exerciseId: id, reps }
}

export const PROGRAM_TEMPLATES = [
  {
    id: 'push',
    muscles: ['chest', 'shoulders', 'triceps'],
    exercises: [
      ex('bench-press', 8),
      ex('incline-bench', 10),
      ex('ohp', 8),
      ex('lateral-raise', 12),
      ex('tricep-pushdown', 12),
      ex('dip', 10),
    ],
  },
  {
    id: 'pull',
    muscles: ['back', 'biceps'],
    exercises: [
      ex('pull-up', 8),
      ex('barbell-row', 8),
      ex('lat-pulldown', 10),
      ex('face-pull', 15),
      ex('barbell-curl', 10),
      ex('hammer-curl', 12),
    ],
  },
  {
    id: 'legs',
    muscles: ['legs', 'glutes'],
    exercises: [
      ex('squat', 8),
      ex('leg-press', 10),
      ex('romanian-deadlift', 10),
      ex('lunge', 10),
      ex('leg-extension', 12),
      ex('leg-curl', 12),
      ex('calf-raise', 15),
    ],
  },
  {
    id: 'fullbody',
    muscles: ['chest', 'back', 'legs', 'shoulders'],
    exercises: [
      ex('squat', 8),
      ex('bench-press', 8),
      ex('barbell-row', 8),
      ex('ohp', 10),
      ex('deadlift', 5),
      ex('plank', 30),
    ],
  },
  {
    id: 'upper',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    exercises: [
      ex('bench-press', 8),
      ex('barbell-row', 8),
      ex('ohp', 8),
      ex('lat-pulldown', 10),
      ex('dumbbell-curl', 12),
      ex('tricep-pushdown', 12),
    ],
  },
  {
    id: 'lower',
    muscles: ['legs', 'glutes', 'core'],
    exercises: [
      ex('squat', 8),
      ex('romanian-deadlift', 10),
      ex('hip-thrust', 10),
      ex('leg-press', 12),
      ex('lunge', 10),
      ex('calf-raise', 15),
      ex('crunch', 15),
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
      const lib = getLibraryExercise(e.exerciseId)
      const name = lib ? exerciseLabel(lib, locale) : e.exerciseId
      return {
        name,
        sets: [{ weight: 0, reps: e.reps, rpe: 5 }],
      }
    }),
  }
}

export function getTemplate(id) {
  return PROGRAM_TEMPLATES.find((t) => t.id === id) ?? null
}
