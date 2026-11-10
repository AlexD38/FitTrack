const EQUIPMENT_LABELS = {
  fr: {
    barbell: 'barre',
    dumbbell: 'haltères',
    machine: 'machine',
    cable: 'poulie',
    bodyweight: 'poids du corps',
  },
  en: {
    barbell: 'barbell',
    dumbbell: 'dumbbell',
    machine: 'machine',
    cable: 'cable',
    bodyweight: 'bodyweight',
  },
}

export function equipmentLabel(equipment, locale) {
  return (locale === 'en' ? EQUIPMENT_LABELS.en : EQUIPMENT_LABELS.fr)[equipment] ?? equipment
}

/**
 * Base movements. The first `equipment` entry is the default variant: names saved before
 * variants existed (e.g. "Développé couché") map to it.
 */
const BASE_EXERCISES = [
  // Chest
  { id: 'bench-press', muscle: 'chest', fr: 'Développé couché', en: 'Bench press', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'incline-bench', muscle: 'chest', fr: 'Développé incliné', en: 'Incline bench press', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'decline-bench', muscle: 'chest', fr: 'Développé décliné', en: 'Decline bench press', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'chest-fly', muscle: 'chest', fr: 'Écarté', en: 'Chest fly', equipment: ['dumbbell', 'machine', 'cable'] },
  { id: 'incline-fly', muscle: 'chest', fr: 'Écarté incliné', en: 'Incline fly', equipment: ['dumbbell', 'cable'] },
  { id: 'chest-press', muscle: 'chest', fr: 'Chest press', en: 'Chest press', equipment: ['machine'] },
  { id: 'pullover', muscle: 'chest', fr: 'Pull-over', en: 'Pullover', equipment: ['dumbbell', 'machine', 'cable'] },
  { id: 'push-up', muscle: 'chest', fr: 'Pompe', en: 'Push-up', equipment: ['bodyweight'] },
  { id: 'chest-dip', muscle: 'chest', fr: 'Dips pectoraux', en: 'Chest dip', equipment: ['bodyweight', 'machine'] },

  // Back
  { id: 'pull-up', muscle: 'back', fr: 'Traction', en: 'Pull-up', equipment: ['bodyweight', 'machine'] },
  { id: 'chin-up', muscle: 'back', fr: 'Traction supination', en: 'Chin-up', equipment: ['bodyweight', 'machine'] },
  { id: 'lat-pulldown', muscle: 'back', fr: 'Tirage vertical', en: 'Lat pulldown', equipment: ['machine', 'cable'] },
  { id: 'row', muscle: 'back', fr: 'Rowing', en: 'Row', equipment: ['barbell', 'dumbbell', 'machine', 'cable'] },
  { id: 'seated-row', muscle: 'back', fr: 'Tirage horizontal', en: 'Seated row', equipment: ['cable', 'machine'] },
  { id: 't-bar-row', muscle: 'back', fr: 'Rowing T-bar', en: 'T-bar row', equipment: ['barbell', 'machine'] },
  { id: 'pendlay-row', muscle: 'back', fr: 'Rowing Pendlay', en: 'Pendlay row', equipment: ['barbell'] },
  { id: 'deadlift', muscle: 'back', fr: 'Soulevé de terre', en: 'Deadlift', equipment: ['barbell', 'dumbbell'] },
  { id: 'straight-arm-pulldown', muscle: 'back', fr: 'Pull-down bras tendus', en: 'Straight-arm pulldown', equipment: ['cable'] },
  { id: 'face-pull', muscle: 'back', fr: 'Face pull', en: 'Face pull', equipment: ['cable'] },
  { id: 'back-extension', muscle: 'back', fr: 'Extension lombaire', en: 'Back extension', equipment: ['bodyweight', 'machine'] },

  // Shoulders
  { id: 'ohp', muscle: 'shoulders', fr: 'Développé militaire', en: 'Overhead press', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'arnold-press', muscle: 'shoulders', fr: 'Développé Arnold', en: 'Arnold press', equipment: ['dumbbell'] },
  { id: 'lateral-raise', muscle: 'shoulders', fr: 'Élévations latérales', en: 'Lateral raise', equipment: ['dumbbell', 'machine', 'cable'] },
  { id: 'front-raise', muscle: 'shoulders', fr: 'Élévations frontales', en: 'Front raise', equipment: ['dumbbell', 'barbell', 'cable'] },
  { id: 'rear-delt-fly', muscle: 'shoulders', fr: 'Oiseau', en: 'Rear delt fly', equipment: ['dumbbell', 'machine', 'cable'] },
  { id: 'upright-row', muscle: 'shoulders', fr: 'Rowing menton', en: 'Upright row', equipment: ['barbell', 'dumbbell', 'cable'] },
  { id: 'shrug', muscle: 'shoulders', fr: 'Shrug', en: 'Shrug', equipment: ['barbell', 'dumbbell', 'machine'] },

  // Biceps
  { id: 'curl', muscle: 'biceps', fr: 'Curl biceps', en: 'Biceps curl', equipment: ['barbell', 'dumbbell', 'machine', 'cable'] },
  { id: 'hammer-curl', muscle: 'biceps', fr: 'Curl marteau', en: 'Hammer curl', equipment: ['dumbbell', 'cable'] },
  { id: 'preacher-curl', muscle: 'biceps', fr: 'Curl pupitre', en: 'Preacher curl', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'incline-curl', muscle: 'biceps', fr: 'Curl incliné', en: 'Incline curl', equipment: ['dumbbell'] },
  { id: 'concentration-curl', muscle: 'biceps', fr: 'Curl concentré', en: 'Concentration curl', equipment: ['dumbbell'] },
  { id: 'spider-curl', muscle: 'biceps', fr: 'Spider curl', en: 'Spider curl', equipment: ['barbell', 'dumbbell'] },

  // Triceps
  { id: 'tricep-pushdown', muscle: 'triceps', fr: 'Extension poulie', en: 'Tricep pushdown', equipment: ['cable'] },
  { id: 'skull-crusher', muscle: 'triceps', fr: 'Barre au front', en: 'Skull crusher', equipment: ['barbell', 'dumbbell'] },
  { id: 'overhead-extension', muscle: 'triceps', fr: 'Extension nuque', en: 'Overhead extension', equipment: ['dumbbell', 'cable', 'barbell'] },
  { id: 'close-grip-bench', muscle: 'triceps', fr: 'Développé couché serré', en: 'Close-grip bench press', equipment: ['barbell', 'machine'] },
  { id: 'tricep-kickback', muscle: 'triceps', fr: 'Kickback triceps', en: 'Tricep kickback', equipment: ['dumbbell', 'cable'] },
  { id: 'dip', muscle: 'triceps', fr: 'Dip', en: 'Dip', equipment: ['bodyweight', 'machine'] },
  { id: 'tricep-press', muscle: 'triceps', fr: 'Presse triceps', en: 'Tricep press machine', equipment: ['machine'] },

  // Legs
  { id: 'squat', muscle: 'legs', fr: 'Squat', en: 'Squat', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'front-squat', muscle: 'legs', fr: 'Squat avant', en: 'Front squat', equipment: ['barbell', 'dumbbell'] },
  { id: 'hack-squat', muscle: 'legs', fr: 'Hack squat', en: 'Hack squat', equipment: ['machine', 'barbell'] },
  { id: 'bulgarian-split-squat', muscle: 'legs', fr: 'Squat bulgare', en: 'Bulgarian split squat', equipment: ['dumbbell', 'barbell', 'bodyweight'] },
  { id: 'leg-press', muscle: 'legs', fr: 'Presse à cuisses', en: 'Leg press', equipment: ['machine'] },
  { id: 'leg-extension', muscle: 'legs', fr: 'Extension jambes', en: 'Leg extension', equipment: ['machine'] },
  { id: 'leg-curl', muscle: 'legs', fr: 'Curl jambes', en: 'Leg curl', equipment: ['machine'] },
  { id: 'lunge', muscle: 'legs', fr: 'Fente', en: 'Lunge', equipment: ['dumbbell', 'barbell', 'bodyweight'] },
  { id: 'step-up', muscle: 'legs', fr: 'Step-up', en: 'Step-up', equipment: ['dumbbell', 'barbell', 'bodyweight'] },
  { id: 'romanian-deadlift', muscle: 'legs', fr: 'Soulevé roumain', en: 'Romanian deadlift', equipment: ['barbell', 'dumbbell'] },
  { id: 'calf-raise', muscle: 'legs', fr: 'Mollets', en: 'Calf raise', equipment: ['machine', 'dumbbell', 'barbell', 'bodyweight'] },
  { id: 'adductor', muscle: 'legs', fr: 'Adducteurs', en: 'Hip adduction', equipment: ['machine', 'cable'] },

  // Glutes
  { id: 'hip-thrust', muscle: 'glutes', fr: 'Hip thrust', en: 'Hip thrust', equipment: ['barbell', 'dumbbell', 'machine'] },
  { id: 'glute-bridge', muscle: 'glutes', fr: 'Pont fessier', en: 'Glute bridge', equipment: ['bodyweight', 'barbell', 'dumbbell'] },
  { id: 'glute-kickback', muscle: 'glutes', fr: 'Kickback fessier', en: 'Glute kickback', equipment: ['cable', 'machine'] },
  { id: 'abductor', muscle: 'glutes', fr: 'Abducteurs', en: 'Hip abduction', equipment: ['machine', 'cable'] },
  { id: 'good-morning', muscle: 'glutes', fr: 'Good morning', en: 'Good morning', equipment: ['barbell'] },
  { id: 'sumo-deadlift', muscle: 'glutes', fr: 'Soulevé de terre sumo', en: 'Sumo deadlift', equipment: ['barbell', 'dumbbell'] },

  // Core
  { id: 'plank', muscle: 'core', fr: 'Planche', en: 'Plank', equipment: ['bodyweight'] },
  { id: 'crunch', muscle: 'core', fr: 'Crunch', en: 'Crunch', equipment: ['bodyweight', 'machine', 'cable'] },
  { id: 'hanging-leg-raise', muscle: 'core', fr: 'Relevé de jambes', en: 'Hanging leg raise', equipment: ['bodyweight'] },
  { id: 'russian-twist', muscle: 'core', fr: 'Russian twist', en: 'Russian twist', equipment: ['bodyweight', 'dumbbell'] },
  { id: 'ab-wheel', muscle: 'core', fr: 'Roue abdominale', en: 'Ab wheel rollout', equipment: ['bodyweight'] },
  { id: 'woodchopper', muscle: 'core', fr: 'Bûcheron', en: 'Woodchopper', equipment: ['cable', 'dumbbell'] },
  { id: 'side-plank', muscle: 'core', fr: 'Planche latérale', en: 'Side plank', equipment: ['bodyweight'] },

  // Cardio
  { id: 'treadmill', muscle: 'cardio', fr: 'Tapis de course', en: 'Treadmill', equipment: [] },
  { id: 'bike', muscle: 'cardio', fr: 'Vélo', en: 'Bike', equipment: [] },
  { id: 'rowing-machine', muscle: 'cardio', fr: 'Rameur', en: 'Rowing machine', equipment: [] },
  { id: 'elliptical', muscle: 'cardio', fr: 'Elliptique', en: 'Elliptical', equipment: [] },
  { id: 'stair-climber', muscle: 'cardio', fr: 'Escalier', en: 'Stair climber', equipment: [] },
  { id: 'jump-rope', muscle: 'cardio', fr: 'Corde à sauter', en: 'Jump rope', equipment: [] },
]

/** Exercises that existed before variants, folded into a base movement + equipment. */
const LEGACY = [
  { id: 'dumbbell-fly', fr: 'Écarté haltères', en: 'Dumbbell fly', to: ['chest-fly', 'dumbbell'] },
  { id: 'cable-crossover', fr: 'Écarté poulie', en: 'Cable crossover', to: ['chest-fly', 'cable'] },
  { id: 'barbell-row', fr: 'Rowing barre', en: 'Barbell row', to: ['row', 'barbell'] },
  { id: 'barbell-curl', fr: 'Curl barre', en: 'Barbell curl', to: ['curl', 'barbell'] },
  { id: 'dumbbell-curl', fr: 'Curl haltères', en: 'Dumbbell curl', to: ['curl', 'dumbbell'] },
  { id: 'cable-kickback', fr: 'Kickback poulie', en: 'Cable kickback', to: ['glute-kickback', 'cable'] },
  { id: 'cable-crunch', fr: 'Crunch poulie', en: 'Cable crunch', to: ['crunch', 'cable'] },
]

function variantId(baseId, equipment) {
  return `${baseId}--${equipment}`
}

function buildLibrary() {
  const list = []
  for (const base of BASE_EXERCISES) {
    const variants = base.equipment.length > 1 ? base.equipment : [base.equipment[0] ?? null]
    for (const equipment of variants) {
      const suffixed = base.equipment.length > 1
      list.push({
        id: suffixed ? variantId(base.id, equipment) : base.id,
        baseId: base.id,
        equipment,
        muscle: base.muscle,
        fr: suffixed ? `${base.fr} (${EQUIPMENT_LABELS.fr[equipment]})` : base.fr,
        en: suffixed ? `${base.en} (${EQUIPMENT_LABELS.en[equipment]})` : base.en,
        baseFr: base.fr,
        baseEn: base.en,
      })
    }
  }
  return list
}

/** Every exercise variant, one entry per name that can be logged. */
export const EXERCISE_LIBRARY = buildLibrary()

const BY_ID = new Map(EXERCISE_LIBRARY.map((ex) => [ex.id, ex]))

/** lowercase name/id → { entry, lang } */
const LOOKUP = (() => {
  const map = new Map()
  const add = (key, entry, lang) => {
    const k = key?.trim().toLowerCase()
    if (k && !map.has(k)) map.set(k, { entry, lang })
  }
  for (const ex of EXERCISE_LIBRARY) {
    add(ex.fr, ex, 'fr')
    add(ex.en, ex, 'en')
    add(ex.id, ex, 'fr')
  }
  for (const base of BASE_EXERCISES) {
    const def = BY_ID.get(base.equipment.length > 1 ? variantId(base.id, base.equipment[0]) : base.id)
    add(base.fr, def, 'fr')
    add(base.en, def, 'en')
    add(base.id, def, 'fr')
  }
  for (const legacy of LEGACY) {
    const entry = BY_ID.get(variantId(...legacy.to))
    add(legacy.fr, entry, 'fr')
    add(legacy.en, entry, 'en')
    add(legacy.id, entry, 'fr')
  }
  return map
})()

export function exerciseLabel(ex, locale) {
  return locale === 'en' ? ex.en : ex.fr
}

export function baseExerciseLabel(ex, locale) {
  return locale === 'en' ? ex.baseEn : ex.baseFr
}

/** Library entry for an id, a base id (→ default variant) or a pre-variant id. */
export function getLibraryExercise(id) {
  return LOOKUP.get(id?.trim().toLowerCase())?.entry ?? null
}

/** Match library entry by FR/EN label, id, or a name saved before variants existed. */
export function findLibraryExercise(name) {
  if (!name?.trim()) return null
  return LOOKUP.get(name.trim().toLowerCase())?.entry ?? null
}

/** Stable identity for history matching: library id when known, else the normalized name. */
export function exerciseKey(name) {
  return findLibraryExercise(name)?.id ?? (name ?? '').trim().toLowerCase()
}

/** Current label for a saved name, in the language it was written in (pre-variant names → default variant). */
export function canonicalExerciseName(name) {
  if (!name?.trim()) return name
  const hit = LOOKUP.get(name.trim().toLowerCase())
  if (!hit) return name
  return hit.lang === 'en' ? hit.entry.en : hit.entry.fr
}

/** Library grouped by movement, variants in a stable equipment order. */
export function groupedLibrary() {
  const groups = new Map()
  for (const ex of EXERCISE_LIBRARY) {
    if (!groups.has(ex.baseId)) {
      groups.set(ex.baseId, { baseId: ex.baseId, muscle: ex.muscle, baseFr: ex.baseFr, baseEn: ex.baseEn, variants: [] })
    }
    groups.get(ex.baseId).variants.push(ex)
  }
  return [...groups.values()]
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
