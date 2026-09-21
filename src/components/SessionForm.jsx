import { useState } from 'react'
import { ExerciseEditor, createEmptyExercise } from './ExerciseEditor'
import { musclesFromExerciseNames } from '../lib/exercises'
import { normalizeSetsForSave } from '../lib/sets'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'

function normalizeSets(exercises) {
  return exercises.map((ex) => ({
    name: ex.name,
    sets: normalizeSetsForSave(ex.sets),
  }))
}

function hydrateExercises(initial) {
  if (!initial?.exercises?.length) return [createEmptyExercise()]
  return initial.exercises.map((ex) => ({
    name: ex.name ?? '',
    sets: (ex.sets ?? []).map((s) => ({
      weight: s.weight === '' || s.weight == null ? 0 : s.weight,
      reps: s.reps ?? '',
      rpe: s.rpe ?? '',
    })),
  }))
}

function syncMuscles(exercises) {
  return musclesFromExerciseNames(exercises.map((e) => e.name))
}

export function SessionForm({ initial, onSave, onCancel }) {
  const { locale, t } = useLocale()
  const [exercises, setExercises] = useState(() => hydrateExercises(initial))
  const [muscles, setMuscles] = useState(() => {
    const hydrated = hydrateExercises(initial)
    const fromEx = syncMuscles(hydrated)
    return fromEx.length ? fromEx : (initial?.muscles ?? [])
  })

  const applyExercises = (next) => {
    setExercises(next)
    const inferred = syncMuscles(next)
    const hasNamed = next.some((e) => e.name?.trim())
    if (inferred.length) setMuscles(inferred)
    else if (!hasNamed) setMuscles([])
  }

  const updateExercise = (idx, ex) => {
    applyExercises(exercises.map((e, i) => (i === idx ? ex : e)))
  }

  const handleSave = () => {
    const cleaned = normalizeSets(exercises).filter((ex) => ex.name?.trim() && ex.sets.length)
    const nextMuscles = musclesFromExerciseNames(cleaned.map((e) => e.name))
    onSave({
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      muscles: nextMuscles.length ? nextMuscles : muscles,
      notes: initial?.notes ?? '',
      exercises: cleaned,
    })
  }

  return (
    <div>
      {muscles.length > 0 && (
        <div className="ft-chip-grid" style={{ marginBottom: 'var(--space-4)' }}>
          {muscles.map((m) => (
            <span key={m} className="ft-chip ft-chip--active" style={{ pointerEvents: 'none' }}>
              {muscleLabel(locale, m)}
            </span>
          ))}
        </div>
      )}

      {exercises.map((ex, i) => (
        <ExerciseEditor
          key={i}
          exercise={ex}
          onChange={(updated) => updateExercise(i, updated)}
          onRemove={
            exercises.length > 1
              ? () => applyExercises(exercises.filter((_, j) => j !== i))
              : undefined
          }
        />
      ))}

      <button
        type="button"
        className="ft-btn ft-btn--secondary"
        style={{ width: '100%', marginBottom: 'var(--space-4)' }}
        onClick={() => applyExercises([...exercises, createEmptyExercise()])}
      >
        + {t('journal.addExercise')}
      </button>

      <div className="ft-btn-row">
        <button type="button" className="ft-btn ft-btn--secondary" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className="ft-btn ft-btn--primary" onClick={handleSave}>
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}
