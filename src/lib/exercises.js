export const EXERCISE_LIBRARY = [
  { id: 'bench-press', muscle: 'chest', fr: 'Développé couché', en: 'Bench press' },
  { id: 'incline-bench', muscle: 'chest', fr: 'Développé incliné', en: 'Incline bench press' },
  { id: 'decline-bench', muscle: 'chest', fr: 'Développé décliné', en: 'Decline bench press' },
  { id: 'dumbbell-fly', muscle: 'chest', fr: 'Écarté haltères', en: 'Dumbbell fly' },
  { id: 'cable-crossover', muscle: 'chest', fr: 'Écarté poulie', en: 'Cable crossover' },
  { id: 'push-up', muscle: 'chest', fr: 'Pompe', en: 'Push-up' },
  { id: 'pull-up', muscle: 'back', fr: 'Traction', en: 'Pull-up' },
  { id: 'lat-pulldown', muscle: 'back', fr: 'Tirage vertical', en: 'Lat pulldown' },
  { id: 'barbell-row', muscle: 'back', fr: 'Rowing barre', en: 'Barbell row' },
  { id: 'seated-row', muscle: 'back', fr: 'Tirage horizontal', en: 'Seated row' },
  { id: 'deadlift', muscle: 'back', fr: 'Soulevé de terre', en: 'Deadlift' },
  { id: 'face-pull', muscle: 'back', fr: 'Face pull', en: 'Face pull' },
  { id: 'ohp', muscle: 'shoulders', fr: 'Développé militaire', en: 'Overhead press' },
  { id: 'lateral-raise', muscle: 'shoulders', fr: 'Élévations latérales', en: 'Lateral raise' },
  { id: 'front-raise', muscle: 'shoulders', fr: 'Élévations frontales', en: 'Front raise' },
  { id: 'rear-delt-fly', muscle: 'shoulders', fr: 'Oiseau', en: 'Rear delt fly' },
  { id: 'shrug', muscle: 'shoulders', fr: 'Shrug', en: 'Shrug' },
  { id: 'barbell-curl', muscle: 'biceps', fr: 'Curl barre', en: 'Barbell curl' },
  { id: 'dumbbell-curl', muscle: 'biceps', fr: 'Curl haltères', en: 'Dumbbell curl' },
  { id: 'hammer-curl', muscle: 'biceps', fr: 'Curl marteau', en: 'Hammer curl' },
  { id: 'preacher-curl', muscle: 'biceps', fr: 'Curl pupitre', en: 'Preacher curl' },
  { id: 'tricep-pushdown', muscle: 'triceps', fr: 'Extension poulie', en: 'Tricep pushdown' },
  { id: 'skull-crusher', muscle: 'triceps', fr: 'Barre au front', en: 'Skull crusher' },
  { id: 'overhead-extension', muscle: 'triceps', fr: 'Extension nuque', en: 'Overhead extension' },
  { id: 'dip', muscle: 'triceps', fr: 'Dip', en: 'Dip' },
  { id: 'squat', muscle: 'legs', fr: 'Squat', en: 'Squat' },
  { id: 'leg-press', muscle: 'legs', fr: 'Presse à cuisses', en: 'Leg press' },
  { id: 'leg-extension', muscle: 'legs', fr: 'Extension jambes', en: 'Leg extension' },
  { id: 'leg-curl', muscle: 'legs', fr: 'Curl jambes', en: 'Leg curl' },
  { id: 'lunge', muscle: 'legs', fr: 'Fente', en: 'Lunge' },
  { id: 'romanian-deadlift', muscle: 'legs', fr: 'Soulevé roumain', en: 'Romanian deadlift' },
  { id: 'calf-raise', muscle: 'legs', fr: 'Mollets', en: 'Calf raise' },
  { id: 'hip-thrust', muscle: 'glutes', fr: 'Hip thrust', en: 'Hip thrust' },
  { id: 'glute-bridge', muscle: 'glutes', fr: 'Pont fessier', en: 'Glute bridge' },
  { id: 'cable-kickback', muscle: 'glutes', fr: 'Kickback poulie', en: 'Cable kickback' },
  { id: 'plank', muscle: 'core', fr: 'Planche', en: 'Plank' },
  { id: 'crunch', muscle: 'core', fr: 'Crunch', en: 'Crunch' },
  { id: 'hanging-leg-raise', muscle: 'core', fr: 'Relevé de jambes', en: 'Hanging leg raise' },
  { id: 'russian-twist', muscle: 'core', fr: 'Russian twist', en: 'Russian twist' },
  { id: 'cable-crunch', muscle: 'core', fr: 'Crunch poulie', en: 'Cable crunch' },
  { id: 'treadmill', muscle: 'cardio', fr: 'Tapis de course', en: 'Treadmill' },
  { id: 'bike', muscle: 'cardio', fr: 'Vélo', en: 'Bike' },
  { id: 'rowing-machine', muscle: 'cardio', fr: 'Rameur', en: 'Rowing machine' },
  { id: 'elliptical', muscle: 'cardio', fr: 'Elliptique', en: 'Elliptical' },
]

export function exerciseLabel(ex, locale) {
  return locale === 'en' ? ex.en : ex.fr
}

/** Match library entry by FR/EN label or id (case-insensitive). */
export function findLibraryExercise(name) {
  if (!name?.trim()) return null
  const q = name.trim().toLowerCase()
  return (
    EXERCISE_LIBRARY.find(
      (ex) =>
        ex.fr.toLowerCase() === q ||
        ex.en.toLowerCase() === q ||
        ex.id.toLowerCase() === q,
    ) ?? null
  )
}

/** Unique muscle ids inferred from exercise names, in MUSCLE_GROUPS order. */
export function musclesFromExerciseNames(names) {
  const found = new Set()
  for (const name of names) {
    const ex = findLibraryExercise(name)
    if (ex?.muscle) found.add(ex.muscle)
  }
  const order = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'legs',
    'glutes',
    'core',
    'cardio',
  ]
  return order.filter((id) => found.has(id))
}

export function searchExercises(query, locale, extraNames = []) {
  const q = query.trim().toLowerCase()
  const fromLib = EXERCISE_LIBRARY.map((ex) => ({
    name: exerciseLabel(ex, locale),
    muscle: ex.muscle,
    source: 'library',
  }))
  const fromHistory = extraNames
    .filter((n) => n && !fromLib.some((e) => e.name.toLowerCase() === n.toLowerCase()))
    .map((name) => ({ name, muscle: null, source: 'history' }))

  const all = [...fromLib, ...fromHistory]
  if (!q) return all.slice(0, 8)
  return all.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 10)
}
