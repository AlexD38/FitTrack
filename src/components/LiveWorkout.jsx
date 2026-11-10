import { useCallback, useEffect, useRef, useState } from 'react'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { ExerciseListEditor, createEmptyExercise } from './ExerciseEditor'
import { RestBar, RestTimerModal, formatRestTime, useRestTimer } from './RestTimer'
import { FaIcon } from './FaIcon'
import { musclesFromExerciseNames } from '../lib/exercises'
import { normalizeSetsForSave } from '../lib/sets'
import { SESSION_STATUS } from '../lib/sessionStatus'
import { durationBetween, formatDuration } from '../lib/duration'
import { lockBodyScroll, unlockBodyScroll } from '../lib/bodyScrollLock'
import { uiIcons } from '../lib/icons'

const RPE_HINT_KEY = 'ft-rpe-hint-seen'

function buildLiveState(payload) {
  return {
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    muscles: [...(payload.muscles ?? [])],
    notes: payload.notes ?? '',
    startedAt: payload.startedAt ?? null,
    exercises: (payload.exercises ?? []).map((ex) => ({
      name: ex.name,
      sets: (ex.sets ?? []).map((s) => ({
        weight: s.weight === '' || s.weight == null ? 0 : s.weight,
        reps: s.reps ?? '',
        rpe: s.rpe ?? 5,
        ...(s.done ? { done: true } : {}),
      })),
    })),
  }
}

function countSets(exercises) {
  let total = 0
  let done = 0
  for (const ex of exercises ?? []) {
    for (const s of ex.sets ?? []) {
      total += 1
      if (s.done) done += 1
    }
  }
  return { total, done }
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
            ...(s.done ? { done: true } : {}),
          })),
    }))
    .filter((ex) => (requireSets ? ex.sets.length > 0 : true))

  const fromEx = musclesFromExerciseNames(exercisePayload.map((e) => e.name))
  return {
    date: workout.date,
    muscles: fromEx.length ? fromEx : workout.muscles,
    notes: workout.notes ?? '',
    startedAt: workout.startedAt ?? null,
    exercises: exercisePayload,
  }
}

export function LiveWorkout({ open, initial, sessionId, onClose, onSaved }) {
  const { updateSession, deleteSession, settings } = useFitness()
  const { t } = useLocale()
  const [workout, setWorkout] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [showRpeHint, setShowRpeHint] = useState(() => {
    try {
      return localStorage.getItem(RPE_HINT_KEY) !== '1'
    } catch {
      return true
    }
  })
  const workoutRef = useRef(null)
  const sessionIdRef = useRef(sessionId)
  const finishingRef = useRef(false)
  const restSeconds = settings.defaultRestSeconds ?? 90
  const timer = useRestTimer(restSeconds)

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    workoutRef.current = workout
  }, [workout])

  useEffect(() => {
    if (!open || !initial || !sessionId) return
    finishingRef.current = false
    const now = Date.now()
    let startedAt = initial.startedAt || new Date(now).toISOString()
    const pausedAt = initial.pausedAt ? Date.parse(initial.pausedAt) : NaN
    // Time spent closed (paused) doesn't count towards the workout duration.
    if (initial.startedAt && !Number.isNaN(pausedAt) && pausedAt <= now) {
      startedAt = new Date(Date.parse(initial.startedAt) + (now - pausedAt)).toISOString()
    }
    const next = buildLiveState({ ...initial, startedAt })
    setWorkout(next)
    if (startedAt !== initial.startedAt || initial.pausedAt) {
      updateSession(sessionId, { startedAt, pausedAt: null, status: SESSION_STATUS.ACTIVE })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [open, sessionId])

  useEffect(() => {
    if (!open || !workout?.startedAt) return
    const tick = () => setElapsed(durationBetween(workout.startedAt))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [open, workout?.startedAt])

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
    updateSession(id, { ...payload, status: SESSION_STATUS.ACTIVE, pausedAt: new Date().toISOString() })
  }, [updateSession])

  const handleClose = useCallback(() => {
    // Don't re-persist as #encours after a successful finish.
    if (finishingRef.current) {
      onClose?.()
      return
    }
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
    if (!workout || !sessionId || finishingRef.current) return
    const named = (workout.exercises ?? []).filter((ex) => ex.name?.trim())
    const usesChecks = named.some((ex) => (ex.sets ?? []).some((s) => s.done))
    const pendingCount = usesChecks
      ? named.reduce((n, ex) => n + (ex.sets ?? []).filter((s) => !s.done).length, 0)
      : 0
    if (pendingCount > 0 && !window.confirm(t('journal.finishPending').replace('{n}', pendingCount))) {
      return
    }
    finishingRef.current = true
    timer.handleClose()
    // Once ✓ is used, only checked sets are real; the rest stays in liveDraft so the session can be resumed.
    const logged = usesChecks
      ? {
          ...workout,
          exercises: workout.exercises.map((ex) => ({
            ...ex,
            sets: (ex.sets ?? []).filter((s) => s.done),
          })),
        }
      : workout
    const cleaned = toPersistPayload(logged, { requireSets: true })
    if (cleaned.exercises.length === 0) {
      deleteSession(sessionId)
      onClose?.()
      return
    }
    const endedAt = new Date().toISOString()
    const durationSeconds = durationBetween(workout.startedAt || endedAt, endedAt)
    const finished = {
      ...cleaned,
      status: SESSION_STATUS.PAST,
      endedAt,
      durationSeconds,
      pausedAt: null,
      liveDraft: pendingCount > 0 ? toPersistPayload(workout, { requireSets: false }).exercises : null,
    }
    updateSession(sessionId, finished)
    onSaved?.({ ...finished, id: sessionId })
    onClose?.()
  }, [workout, sessionId, updateSession, deleteSession, onClose, onSaved, timer, t])

  const dismissRpeHint = () => {
    setShowRpeHint(false)
    try {
      localStorage.setItem(RPE_HINT_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const startRest = () => timer.start(restSeconds, { focus: false })

  if (!open || !workout) return null

  const progress = countSets(workout.exercises)

  return (
    <div className="ft-live" role="dialog" aria-modal="true" aria-label={t('live.title')}>
      <header className="ft-live__header">
        <div className="ft-live__header-main">
          <div className="ft-live__header-row">
            <div className="ft-live__title-wrap">
              <h2 className="ft-live__title">{t('live.title')}</h2>
              <p className="ft-live__elapsed">
                {formatDuration(elapsed)}
                {progress.total > 0 && (
                  <span className="ft-live__progress">
                    {' · '}
                    {progress.done}/{progress.total} {t('common.sets')}
                  </span>
                )}
              </p>
            </div>
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
        <div className="ft-live__bar" aria-hidden="true">
          <span
            className="ft-live__bar-fill"
            style={{ transform: `scaleX(${progress.total ? progress.done / progress.total : 0})` }}
          />
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
          trackDone
          onSetDone={startRest}
        />
      </div>

      <footer className="ft-live__footer">
        <RestBar timer={timer} />
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
        onMinimize={() => timer.setFocused(false)}
        timeRef={timer.timeRef}
        ringRef={timer.ringRef}
      />
    </div>
  )
}
