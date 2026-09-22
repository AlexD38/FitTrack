import { useState } from 'react'
import { ExerciseListEditor, createEmptyExercise } from './ExerciseEditor'
import { musclesFromExerciseNames } from '../lib/exercises'
import { normalizeSetsForSave } from '../lib/sets'
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

function softNormalizeExercises(exercises) {
  return exercises
    .filter((ex) => ex.name?.trim())
    .map((ex) => ({
      name: ex.name.trim(),
      sets: (ex.sets?.length ? ex.sets : [{ weight: 0, reps: '', rpe: 5 }]).map((s) => ({
        weight: s.weight === '' || s.weight == null ? 0 : Number(s.weight) || 0,
        reps: s.reps === '' || s.reps == null ? '' : Number(s.reps),
        rpe: s.rpe === '' || s.rpe == null ? 5 : Number(s.rpe),
      })),
    }))
}

function strictNormalizeExercises(exercises) {
  return exercises
    .map((ex) => ({
      name: ex.name?.trim() ?? '',
      sets: normalizeSetsForSave(ex.sets),
    }))
    .filter((ex) => ex.name && ex.sets.length)
}

export function SessionForm({ initial, onSave, onCancel, draftMode = false }) {
  const { locale, t } = useLocale()
  const [date, setDate] = useState(() => initial?.date ?? new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState(() => initial?.notes ?? '')
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

  const handleSave = () => {
    const cleaned = draftMode ? softNormalizeExercises(exercises) : strictNormalizeExercises(exercises)
    if (cleaned.length === 0) return
    const nextMuscles = musclesFromExerciseNames(cleaned.map((e) => e.name))
    onSave({
      date,
      muscles: nextMuscles.length ? nextMuscles : muscles,
      notes: notes.trim(),
      exercises: cleaned,
    })
  }

  return (
    <div>
      <label className="ft-field">
        <span className="ft-field__label">{t('journal.date')}</span>
        <input
          className="ft-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="ft-field">
        <span className="ft-field__label">{t('journal.notes')}</span>
        <textarea
          className="ft-input"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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

      <div className="ft-btn-row" style={{ marginTop: 'var(--space-4)' }}>
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
