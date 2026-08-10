import { useCallback, useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import { FaIcon } from './FaIcon'
import { RpeGauge } from './RpeGauge'
import { musclesFromExerciseNames } from '../lib/exercises'
import { emptySet, normalizeSetsForSave } from '../lib/sets'
import { uiIcons } from '../lib/icons'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function RestOverlay({ seconds, onDone, t }) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(true)
  const timeRef = useRef(null)

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, remaining])

  useEffect(() => {
    if (remaining === 0) {
      const tmo = setTimeout(onDone, 600)
      return () => clearTimeout(tmo)
    }
  }, [remaining, onDone])

  useEffect(() => {
    const el = timeRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    animate(el, { scale: [1.06, 1], duration: 280, ease: 'outExpo' })
  }, [remaining])

  return (
    <div className="ft-live-rest" role="dialog" aria-modal="true" aria-label={t('timer.title')}>
      <p className="ft-live-rest__label">{remaining === 0 ? t('timer.done') : t('timer.rest')}</p>
      <p className="ft-live-rest__time" ref={timeRef}>
        {remaining === 0 ? '✓' : formatTime(remaining)}
      </p>
      <div className="ft-btn-row">
        {running ? (
          <button type="button" className="ft-btn ft-btn--secondary" onClick={() => setRunning(false)}>
            {t('timer.pause')}
          </button>
        ) : remaining > 0 ? (
          <button type="button" className="ft-btn ft-btn--primary" onClick={() => setRunning(true)}>
            {t('timer.start')}
          </button>
        ) : null}
        <button type="button" className="ft-btn ft-btn--primary" onClick={onDone}>
          {t('live.skipRest')}
        </button>
      </div>
    </div>
  )
}

function buildLiveState(payload) {
  return {
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    muscles: [...(payload.muscles ?? [])],
    notes: payload.notes ?? '',
    exercises: (payload.exercises ?? []).map((ex) => ({
      name: ex.name,
      sets: (ex.sets ?? []).map((s) => ({
        weight: s.weight === '' || s.weight == null ? 0 : s.weight,
        reps: s.reps ?? '',
        rpe: s.rpe ?? '',
        done: false,
      })),
    })),
  }
}

export function LiveWorkout({ open, initial, onClose, onSaved }) {
  const { addSession, settings } = useFitness()
  const { t } = useLocale()
  const [workout, setWorkout] = useState(null)
  const [resting, setResting] = useState(false)
  const restSeconds = settings.defaultRestSeconds ?? 90

  useEffect(() => {
    if (!open || !initial) return
    setWorkout(buildLiveState(initial))
    setResting(false)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, initial])

  const toggleSet = (exIdx, setIdx) => {
    setWorkout((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = ex.sets.map((s, j) => {
          if (j !== setIdx) return s
          return { ...s, done: !s.done }
        })
        return { ...ex, sets }
      })
      return { ...prev, exercises }
    })
    const wasDone = workout?.exercises?.[exIdx]?.sets?.[setIdx]?.done
    if (!wasDone) setResting(true)
  }

  const updateSetValue = (exIdx, setIdx, field, val) => {
    setWorkout((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const sets = ex.sets.map((s, j) => {
          if (j !== setIdx) return s
          return { ...s, [field]: val === '' ? '' : Number(val) }
        })
        return { ...ex, sets }
      })
      return { ...prev, exercises }
    })
  }

  const addSet = (exIdx) => {
    setWorkout((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1] ?? emptySet()
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              ...emptySet({
                weight: last.weight !== '' && last.weight != null ? last.weight : 0,
                reps: last.reps !== '' && last.reps != null ? last.reps : '',
                rpe: last.rpe ?? '',
              }),
              done: false,
            },
          ],
        }
      })
      return { ...prev, exercises }
    })
  }

  const removeLastSet = (exIdx) => {
    setWorkout((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((ex, i) => {
        if (i !== exIdx || ex.sets.length <= 1) return ex
        return { ...ex, sets: ex.sets.slice(0, -1) }
      })
      return { ...prev, exercises }
    })
  }

  const addExercise = () => {
    setWorkout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          { name: '', sets: [{ ...emptySet(), done: false }] },
        ],
      }
    })
  }

  const renameExercise = (exIdx, name) => {
    setWorkout((prev) => {
      if (!prev) return prev
      const exercises = prev.exercises.map((ex, i) => (i === exIdx ? { ...ex, name } : ex))
      const fromEx = musclesFromExerciseNames(exercises.map((ex) => ex.name))
      return {
        ...prev,
        exercises,
        muscles: fromEx.length ? fromEx : prev.muscles,
      }
    })
  }

  const handleFinish = useCallback(() => {
    if (!workout) return
    const exercisePayload = workout.exercises
      .filter((ex) => ex.name?.trim())
      .map((ex) => ({
        name: ex.name.trim(),
        sets: normalizeSetsForSave(ex.sets),
      }))
      .filter((ex) => ex.sets.length > 0)

    const fromEx = musclesFromExerciseNames(exercisePayload.map((e) => e.name))
    const cleaned = {
      date: workout.date,
      muscles: fromEx.length ? fromEx : workout.muscles,
      notes: workout.notes,
      exercises: exercisePayload,
    }
    if (cleaned.exercises.length === 0) {
      onClose?.()
      return
    }
    const id = addSession(cleaned)
    onSaved?.({ ...cleaned, id })
    onClose?.()
  }, [workout, addSession, onClose, onSaved])

  if (!open || !workout) return null

  const doneCount = workout.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.done).length,
    0,
  )
  const totalSets = workout.exercises.reduce((n, ex) => n + ex.sets.length, 0)

  return (
    <div className="ft-live" role="dialog" aria-modal="true" aria-label={t('live.title')}>
      <header className="ft-live__header">
        <div>
          <h2 className="ft-live__title">{t('live.title')}</h2>
          <p className="ft-live__progress">
            {doneCount}/{totalSets} {t('common.sets')}
          </p>
        </div>
        <button type="button" className="ft-btn ft-btn--ghost" onClick={onClose}>
          {t('common.close')}
        </button>
      </header>

      <div className="ft-live__body">
        {workout.exercises.map((ex, exIdx) => (
          <section key={exIdx} className="ft-glass ft-glass--pad ft-live__exercise">
            <ExerciseAutocomplete
              value={ex.name}
              onChange={(name) => renameExercise(exIdx, name)}
              placeholder={t('journal.exerciseName')}
            />
            {ex.sets.map((set, setIdx) => (
              <div
                key={setIdx}
                className={`ft-set-block ft-live__set${set.done ? ' ft-live__set--done' : ''}`}
              >
                <div className="ft-set-row">
                  <button
                    type="button"
                    className={`ft-live__check${set.done ? ' ft-live__check--on' : ''}`}
                    onClick={() => toggleSet(exIdx, setIdx)}
                    aria-pressed={set.done}
                    aria-label={t('live.markSet')}
                  >
                    {set.done ? <FaIcon icon={uiIcons.check} className="ft-live__check-icon" /> : null}
                  </button>
                  <span className="ft-set-row__num">{setIdx + 1}</span>
                  <input
                    className="ft-input ft-input--sm"
                    type="number"
                    inputMode="decimal"
                    value={set.weight === '' || set.weight == null ? 0 : set.weight}
                    min={0}
                    step="any"
                    onChange={(e) => updateSetValue(exIdx, setIdx, 'weight', e.target.value)}
                    aria-label={t('journal.weight')}
                  />
                  <span>×</span>
                  <input
                    className="ft-input ft-input--sm"
                    type="number"
                    inputMode="numeric"
                    value={set.reps}
                    onChange={(e) => updateSetValue(exIdx, setIdx, 'reps', e.target.value)}
                    aria-label={t('common.reps')}
                  />
                </div>
                <RpeGauge
                  value={set.rpe ?? ''}
                  onChange={(v) => updateSetValue(exIdx, setIdx, 'rpe', v)}
                />
              </div>
            ))}
            <div className="ft-exercise-block__set-actions">
              <button
                type="button"
                className="ft-btn ft-btn--secondary"
                onClick={() => addSet(exIdx)}
                aria-label={t('journal.addSet')}
              >
                +
              </button>
              <button
                type="button"
                className="ft-btn ft-btn--secondary"
                onClick={() => removeLastSet(exIdx)}
                disabled={ex.sets.length <= 1}
                aria-label={t('journal.removeSet')}
              >
                −
              </button>
            </div>
          </section>
        ))}

        <button type="button" className="ft-btn ft-btn--secondary" style={{ width: '100%' }} onClick={addExercise}>
          + {t('journal.addExercise')}
        </button>
      </div>

      <footer className="ft-live__footer">
        <button type="button" className="ft-btn ft-btn--primary" style={{ width: '100%' }} onClick={handleFinish}>
          {t('live.finish')}
        </button>
      </footer>

      {resting && (
        <RestOverlay seconds={restSeconds} onDone={() => setResting(false)} t={t} />
      )}
    </div>
  )
}
