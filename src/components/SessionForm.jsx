import { useState } from 'react'
import { Chip } from './Chip'
import { ExerciseEditor, createEmptyExercise } from './ExerciseEditor'
import { SessionExercisesView } from './SessionExercisesView'
import { MUSCLE_GROUPS } from '../lib/muscles'
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
  const [step, setStep] = useState(0)
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10))
  const [muscles, setMuscles] = useState(() => {
    const hydrated = hydrateExercises(initial)
    const fromEx = syncMuscles(hydrated)
    return fromEx.length ? fromEx : (initial?.muscles ?? [])
  })
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [exercises, setExercises] = useState(() => hydrateExercises(initial))

  const toggleMuscle = (id) => {
    setMuscles((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const applyExercises = (next) => {
    setExercises(next)
    setMuscles(syncMuscles(next))
  }

  const updateExercise = (idx, ex) => {
    applyExercises(exercises.map((e, i) => (i === idx ? ex : e)))
  }

  const handleSave = () => {
    const cleaned = normalizeSets(exercises).filter((ex) => ex.name?.trim() && ex.sets.length)
    const nextMuscles = musclesFromExerciseNames(cleaned.map((e) => e.name))
    onSave({
      date,
      muscles: nextMuscles.length ? nextMuscles : muscles,
      notes,
      exercises: cleaned,
    })
  }

  const steps = [t('journal.step1'), t('journal.step2'), t('journal.step3')]

  return (
    <div>
      <div className="ft-steps">
        {steps.map((_, i) => (
          <div key={i} className={`ft-step${i <= step ? ' ft-step--active' : ''}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <div className="ft-field">
            <label className="ft-field__label">{t('journal.date')}</label>
            <input
              className="ft-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="ft-field">
            <label className="ft-field__label">{t('journal.muscles')}</label>
            <p className="ft-field__hint">{t('journal.musclesHint')}</p>
            <div className="ft-chip-grid">
              {MUSCLE_GROUPS.map((m) => (
                <Chip key={m.id} active={muscles.includes(m.id)} onClick={() => toggleMuscle(m.id)}>
                  {muscleLabel(locale, m.id)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="ft-field">
            <label className="ft-field__label">{t('journal.notes')}</label>
            <textarea
              className="ft-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="ft-btn-row">
            <button type="button" className="ft-btn ft-btn--secondary" onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button type="button" className="ft-btn ft-btn--primary" onClick={() => setStep(1)}>
              →
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          {muscles.length > 0 && (
            <div className="ft-chip-grid" style={{ marginBottom: 'var(--space-4)' }}>
              {muscles.map((m) => (
                <span
                  key={m}
                  className="ft-chip ft-chip--active"
                  style={{ pointerEvents: 'none' }}
                >
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
            <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setStep(0)}>
              ←
            </button>
            <button type="button" className="ft-btn ft-btn--primary" onClick={() => setStep(2)}>
              →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="ft-field__label">{date}</p>
          <div className="ft-chip-grid" style={{ marginBottom: 'var(--space-4)' }}>
            {muscles.map((m) => (
              <span key={m} className="ft-chip ft-chip--active">
                {muscleLabel(locale, m)}
              </span>
            ))}
          </div>
          <SessionExercisesView exercises={normalizeSets(exercises)} />
          <div className="ft-btn-row">
            <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setStep(1)}>
              ←
            </button>
            <button type="button" className="ft-btn ft-btn--primary" onClick={handleSave}>
              {t('common.save')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
