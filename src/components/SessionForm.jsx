import { useEffect, useRef, useState } from 'react'
import { ExerciseListEditor, createEmptyExercise } from './ExerciseEditor'
import { musclesFromExerciseNames } from '../lib/exercises'
import { muscleLabel } from '../lib/i18n'
import { useLocale } from '../contexts/LocaleContext'

function hydrateExercises(initial) {
  if (!initial?.exercises?.length) return [createEmptyExercise()]
  return initial.exercises.map((ex) => ({
    name: ex.name ?? '',
    sets: (ex.sets ?? []).map((s) => ({
      weight: s.weight === '' || s.weight == null ? 0 : s.weight,
      reps: s.reps ?? '',
      rpe: s.rpe ?? 5,
    })),
  }))
}

function syncMuscles(exercises) {
  return musclesFromExerciseNames(exercises.map((e) => e.name))
}

function persistPayload(date, notes, exercises, fallbackMuscles) {
  const cleaned = exercises
    .filter((ex) => ex.name?.trim())
    .map((ex) => ({
      name: ex.name.trim(),
      sets: (ex.sets?.length ? ex.sets : [{ weight: 0, reps: '', rpe: 5 }]).map((s) => ({
        weight: s.weight === '' || s.weight == null ? 0 : Number(s.weight) || 0,
        reps: s.reps === '' || s.reps == null ? '' : Number(s.reps),
        rpe: s.rpe === '' || s.rpe == null ? 5 : Number(s.rpe),
      })),
    }))
  const nextMuscles = musclesFromExerciseNames(cleaned.map((e) => e.name))
  return {
    date,
    notes: notes.trim(),
    muscles: nextMuscles.length ? nextMuscles : fallbackMuscles,
    exercises: cleaned,
  }
}

/** Live-editing session form — every change persists immediately (no Save). */
export function SessionForm({ initial, onChange }) {
  const { locale, t } = useLocale()
  const [date, setDate] = useState(() => initial?.date ?? new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState(() => initial?.notes ?? '')
  const [exercises, setExercises] = useState(() => hydrateExercises(initial))
  const [muscles, setMuscles] = useState(() => {
    const hydrated = hydrateExercises(initial)
    const fromEx = syncMuscles(hydrated)
    return fromEx.length ? fromEx : (initial?.muscles ?? [])
  })

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const emit = (nextDate, nextNotes, nextExercises, nextMuscles) => {
    onChangeRef.current?.(persistPayload(nextDate, nextNotes, nextExercises, nextMuscles))
  }

  const applyExercises = (next) => {
    setExercises(next)
    const inferred = syncMuscles(next)
    const hasNamed = next.some((e) => e.name?.trim())
    const nextMuscles = inferred.length ? inferred : hasNamed ? muscles : []
    setMuscles(nextMuscles)
    emit(date, notes, next, nextMuscles)
  }

  return (
    <div>
      <label className="ft-field">
        <span className="ft-field__label">{t('journal.date')}</span>
        <input
          className="ft-input"
          type="date"
          value={date}
          onChange={(e) => {
            const next = e.target.value
            setDate(next)
            emit(next, notes, exercises, muscles)
          }}
        />
      </label>

      <label className="ft-field">
        <span className="ft-field__label">{t('journal.notes')}</span>
        <textarea
          className="ft-input"
          rows={2}
          value={notes}
          onChange={(e) => {
            const next = e.target.value
            setNotes(next)
            emit(date, next, exercises, muscles)
          }}
          placeholder={t('journal.notes')}
        />
      </label>

      {muscles.length > 0 && (
        <div className="ft-chip-grid" style={{ marginBottom: 'var(--space-4)' }}>
          {muscles.map((m) => (
            <span key={m} className="ft-chip ft-chip--active" style={{ pointerEvents: 'none' }}>
              {muscleLabel(locale, m)}
            </span>
          ))}
        </div>
      )}

      <ExerciseListEditor exercises={exercises} onChange={applyExercises} />
    </div>
  )
}
