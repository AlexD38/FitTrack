import { useCallback, useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useLocale } from '../contexts/LocaleContext'
import { lockBodyScroll, unlockBodyScroll } from '../lib/bodyScrollLock'

const RING_R = 110
const CIRCUMFERENCE = 2 * Math.PI * RING_R

export function formatRestTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function TimerRing({ remaining, duration, done, timeRef, ringRef, large }) {
  const progress = duration > 0 ? (duration - remaining) / duration : 0
  const offset = CIRCUMFERENCE * (1 - progress)

  return (
    <div
      className={`ft-timer__ring-wrap${large ? ' ft-timer__ring-wrap--large' : ''}`}
      ref={ringRef}
    >
      <svg className="ft-timer__ring" viewBox="0 0 240 240">
        <defs>
          <linearGradient id="ft-timer-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-accent-2)" />
          </linearGradient>
        </defs>
        <circle className="ft-timer__ring-bg" cx="120" cy="120" r={RING_R} />
        <circle
          className="ft-timer__ring-progress"
          cx="120"
          cy="120"
          r={RING_R}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ft-timer__display">
        <span className="ft-timer__time" ref={timeRef}>
          {done ? '✓' : formatRestTime(remaining)}
        </span>
      </div>
    </div>
  )
}

function TimerControls({ running, done, onReset, onStart, onPause, onAdd15, t }) {
  return (
    <div className="ft-timer__controls">
      <button type="button" className="ft-btn ft-btn--secondary" onClick={onReset}>
        {t('timer.reset')}
      </button>
      {running ? (
        <button type="button" className="ft-btn ft-btn--primary" onClick={onPause}>
          {t('timer.pause')}
        </button>
      ) : (
        <button type="button" className="ft-btn ft-btn--primary" onClick={onStart}>
          {done ? t('timer.restart') : t('timer.start')}
        </button>
      )}
      <button type="button" className="ft-btn ft-btn--secondary" onClick={onAdd15}>
        {t('timer.add15')}
      </button>
    </div>
  )
}

export function RestTimerModal({
  open,
  remaining,
  duration,
  running,
  done,
  onReset,
  onStart,
  onPause,
  onAdd15,
  onClose,
  timeRef,
  ringRef,
}) {
  const { t } = useLocale()
  const modalRef = useRef(null)

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [open])

  useEffect(() => {
    if (!open || !modalRef.current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    animate(modalRef.current, {
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 380,
      ease: 'outExpo',
    })
  }, [open])

  if (!open) return null

  return (
    <div
      className={`ft-timer-modal${done ? ' ft-timer--done' : ''}`}
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('timer.title')}
    >
      <div className="ft-timer-modal__content">
        <p className="ft-timer-modal__status">
          {done ? t('timer.done') : running ? t('timer.rest') : t('timer.paused')}
        </p>

        <TimerRing
          remaining={remaining}
          duration={duration}
          done={done}
          timeRef={timeRef}
          ringRef={ringRef}
          large
        />

        <TimerControls
          running={running}
          done={done}
          onReset={onReset}
          onStart={onStart}
          onPause={onPause}
          onAdd15={onAdd15}
          t={t}
        />

        {!running && (
          <button type="button" className="ft-timer-modal__close" onClick={onClose}>
            {t('timer.close')}
          </button>
        )}
      </div>
    </div>
  )
}

/** Shared rest-timer state for Timer page + Live workout. */
export function useRestTimer(defaultSeconds = 90) {
  const initial = Math.max(5, defaultSeconds || 90)
  const [duration, setDuration] = useState(initial)
  const [remaining, setRemaining] = useState(initial)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState(false)
  const timeRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!running || remaining <= 0) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false)
          setDone(true)
          if (navigator.vibrate) navigator.vibrate([200, 100, 200])
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, remaining])

  useEffect(() => {
    const el = timeRef.current
    if (!el || !focused) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    animate(el, { scale: [1.06, 1], duration: 300, ease: 'outExpo' })
  }, [remaining, focused])

  useEffect(() => {
    if (!done || !ringRef.current || !focused) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    animate(ringRef.current, {
      scale: [1, 1.08, 1],
      duration: 600,
      ease: 'outExpo',
    })
  }, [done, focused])

  const applyDuration = useCallback((seconds) => {
    const clamped = Math.max(5, Math.min(seconds, 330))
    setDuration(clamped)
    setRemaining(clamped)
    setRunning(false)
    setDone(false)
    setFocused(false)
  }, [])

  const start = useCallback(
    (seconds) => {
      const next = Math.max(5, Math.min(seconds ?? duration, 330))
      setDuration(next)
      setRemaining(next)
      setDone(false)
      setFocused(true)
      setRunning(true)
    },
    [duration],
  )

  const handleStart = useCallback(() => {
    if (done) {
      setRemaining(duration)
      setDone(false)
    }
    setFocused(true)
    setRunning(true)
  }, [done, duration])

  const handleReset = useCallback(() => {
    setRunning(false)
    setDone(false)
    setFocused(false)
    setRemaining(duration)
  }, [duration])

  const handleClose = useCallback(() => {
    setRunning(false)
    setFocused(false)
  }, [])

  const handleAdd15 = useCallback(() => setRemaining((r) => r + 15), [])

  return {
    duration,
    remaining,
    running,
    done,
    focused,
    timeRef,
    ringRef,
    applyDuration,
    start,
    handleStart,
    handleReset,
    handleClose,
    handleAdd15,
    setRunning,
    setFocused,
  }
}

export { TimerRing }
