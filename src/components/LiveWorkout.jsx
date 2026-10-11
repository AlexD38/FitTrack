import { useCallback, useEffect, useRef, useState } from 'react'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { ExerciseListEditor, createEmptyExercise } from './ExerciseEditor'
import { RestTimerModal, formatRestTime, useRestTimer } from './RestTimer'
import { FaIcon } from './FaIcon'
import { musclesFromExerciseNames } from '../lib/exercises'
import { normalizeSetsForSave } from '../lib/sets'
import { SESSION_STATUS } from '../lib/sessionStatus'
import { lockBodyScroll, unlockBodyScroll } from '../lib/bodyScrollLock'
import { uiIcons } from '../lib/icons'

const RPE_HINT_KEY = 'ft-rpe-hint-seen'

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
        rpe: s.rpe ?? 5,
      })),
    })),
  }
}

function toPersistPayload(workout, { requireSets }) {
  const exercisePayload = (workout.exercises ?? [])
    .filter((ex) => ex.name?.trim())
    .map((ex) => ({
      name: ex.name.trim(),
      sets: requireSets
        ? normalizeSetsForSave(ex.sets)
        : (ex.sets ?? []).map((s) => ({
            weight: s.weight === '' || s.weight == null ? 0 : s.weight,
            reps: s.reps ?? '',
            rpe: s.rpe === '' || s.rpe == null ? 5 : s.rpe,
          })),
    }))
    .filter((ex) => (requireSets ? ex.sets.length > 0 : true))

  const fromEx = musclesFromExerciseNames(exercisePayload.map((e) => e.name))
  return {
    date: workout.date,
    muscles: fromEx.length ? fromEx : workout.muscles,
    notes: workout.notes ?? '',
    exercises: exercisePayload,
  }
}

export function LiveWorkout({ open, initial, sessionId, onClose, onSaved }) {
  const { updateSession, deleteSession, settings } = useFitness()
  const { t } = useLocale()
  const [workout, setWorkout] = useState(null)
  const [showRpeHint, setShowRpeHint] = useState(() => {
    try {
      return localStorage.getItem(RPE_HINT_KEY) !== '1'
    } catch {
      return true
    }
  })
  const workoutRef = useRef(null)
  const sessionIdRef = useRef(sessionId)
  const restSeconds = settings.defaultRestSeconds ?? 90
  const timer = useRestTimer(restSeconds)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    workoutRef.current = workout
  }, [workout])

  useEffect(() => {
    if (!open || !initial) return
    setWorkout(buildLiveState(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [open, sessionId])

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [open])

  const persistActive = useCallback(() => {
    const id = sessionIdRef.current
    const current = workoutRef.current
    if (!id || !current) return
    const payload = toPersistPayload(current, { requireSets: false })
    updateSession(id, { ...payload, status: SESSION_STATUS.ACTIVE })
  }, [updateSession])

  const handleClose = useCallback(() => {
    timer.handleClose()
    persistActive()
    onClose?.()
  }, [persistActive, onClose, timer])

  const setExercises = (next) => {
    setWorkout((prev) => {
      if (!prev) return prev
      const fromEx = musclesFromExerciseNames(next.map((ex) => ex.name))
      const hasNamed = next.some((ex) => ex.name?.trim())
      return {
        ...prev,
        exercises: next.length ? next : [createEmptyExercise()],
        muscles: fromEx.length ? fromEx : hasNamed ? prev.muscles : [],
      }
    })
  }

  const handleFinish = useCallback(() => {
    if (!workout || !sessionId) return
    timer.handleClose()
    const cleaned = toPersistPayload(workout, { requireSets: true })
    if (cleaned.exercises.length === 0) {
      deleteSession(sessionId)
      onClose?.()
      return
    }
    updateSession(sessionId, { ...cleaned, status: SESSION_STATUS.PAST })
    onSaved?.({ ...cleaned, id: sessionId, status: SESSION_STATUS.PAST })
    onClose?.()
  }, [workout, sessionId, updateSession, deleteSession, onClose, onSaved, timer])

  const dismissRpeHint = () => {
    setShowRpeHint(false)
    try {
      localStorage.setItem(RPE_HINT_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const startRest = () => timer.start(settings.defaultRestSeconds ?? 90)

  if (!open || !workout) return null

  return (
    <div className="ft-live" role="dialog" aria-modal="true" aria-label={t('live.title')}>
      <header className="ft-live__header">
        <div className="ft-live__header-main">
          <div className="ft-live__header-row">
            <h2 className="ft-live__title">{t('live.title')}</h2>
            <div className="ft-live__header-actions">
              <button
                type="button"
                className="ft-live__rest"
                onClick={startRest}
                aria-label={t('live.rest')}
              >
                <FaIcon icon={uiIcons.timer} className="ft-live__rest-icon" />
                <span>{formatRestTime(restSeconds)}</span>
              </button>
              <button
                type="button"
                className="ft-live__close"
                onClick={handleClose}
                aria-label={t('common.close')}
              >
                <FaIcon icon={uiIcons.close} className="ft-live__close-icon" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="ft-live__body">
        {showRpeHint && (
          <div className="ft-live__rpe-hint" role="note">
            <p className="ft-live__rpe-hint-text">
              <strong>{t('rpe.label')}</strong> — {t('rpe.hint')}
            </p>
            <button type="button" className="ft-live__rpe-hint-close" onClick={dismissRpeHint}>
              {t('common.close')}
            </button>
          </div>
        )}

        <ExerciseListEditor
          exercises={workout.exercises}
          onChange={setExercises}
          focusMode
          onStartRest={startRest}
        />
      </div>

      <footer className="ft-live__footer">
        <button
          type="button"
          className="ft-btn ft-btn--primary"
          style={{ width: '100%' }}
          onClick={handleFinish}
        >
          {t('live.finish')}
        </button>
      </footer>

      <RestTimerModal
        open={timer.focused}
        remaining={timer.remaining}
        duration={timer.duration}
        running={timer.running}
        done={timer.done}
        onReset={timer.handleReset}
        onStart={timer.handleStart}
        onPause={() => timer.setRunning(false)}
        onAdd15={timer.handleAdd15}
        onClose={timer.handleClose}
        timeRef={timer.timeRef}
        ringRef={timer.ringRef}
      />
    </div>
  )
}
