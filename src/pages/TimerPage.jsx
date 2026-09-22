import { useCallback, useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { TimeRollPicker, partsToSeconds, secondsToParts } from '../components/TimeRollPicker'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { lockBodyScroll, unlockBodyScroll } from '../lib/bodyScrollLock'

const PRESETS = [
  { seconds: 60, labelKey: 'timer.preset1' },
  { seconds: 90, labelKey: 'timer.preset2' },
  { seconds: 120, labelKey: 'timer.preset3' },
  { seconds: 150, labelKey: 'timer.preset4' },
]

const RING_R = 110
const CIRCUMFERENCE = 2 * Math.PI * RING_R

function formatTime(seconds) {
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
          {done ? '✓' : formatTime(remaining)}
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

function TimerFocusModal({
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
  t,
}) {
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

export function TimerPage({ onOpenSettings }) {
  const { settings } = useFitness()
  const { t } = useLocale()
  const initial = settings.defaultRestSeconds ?? 90
  const [duration, setDuration] = useState(initial)
  const [remaining, setRemaining] = useState(initial)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(
    PRESETS.some((p) => p.seconds === initial) ? initial : null,
  )
  const [rollParts, setRollParts] = useState(() => secondsToParts(initial))
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

  const applyDuration = useCallback((seconds, preset = null) => {
    const clamped = Math.max(5, Math.min(seconds, 330))
    setDuration(clamped)
    setRemaining(clamped)
    setRollParts(secondsToParts(clamped))
    setActivePreset(preset)
    setRunning(false)
    setDone(false)
    setFocused(false)
  }, [])

  const handleRollChange = (minutes, seconds) => {
    const total = partsToSeconds(minutes, seconds)
    if (total === 0) return
    applyDuration(total, null)
  }

  const handleStart = () => {
    if (done) {
      setRemaining(duration)
      setDone(false)
    }
    setFocused(true)
    setRunning(true)
  }

  const handleReset = useCallback(() => {
    setRunning(false)
    setDone(false)
    setFocused(false)
    setRemaining(duration)
  }, [duration])

  const handleClose = () => {
    setRunning(false)
    setFocused(false)
  }

  const handleAdd15 = () => setRemaining((r) => r + 15)

  return (
    <>
      <PageHeader title={t('timer.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <div className="ft-timer">
        <div className="ft-timer__presets">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              type="button"
              className={`ft-timer__preset${activePreset === p.seconds ? ' ft-timer__preset--active' : ''}`}
              onClick={() => applyDuration(p.seconds, p.seconds)}
              disabled={focused}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`ft-timer__custom-toggle${customOpen ? ' ft-timer__custom-toggle--open' : ''}`}
          onClick={() => setCustomOpen((o) => !o)}
          aria-expanded={customOpen}
          disabled={focused}
        >
          <span>{t('timer.custom')}</span>
          <span className="ft-timer__custom-chevron" aria-hidden="true">
            {customOpen ? '▲' : '▼'}
          </span>
        </button>

        {customOpen && !focused && (
          <TimeRollPicker
            minutes={rollParts.minutes}
            seconds={rollParts.seconds}
            onChange={handleRollChange}
            disabled={focused}
          />
        )}

        {!focused && (
          <>
            <TimerRing
              remaining={remaining}
              duration={duration}
              done={false}
              timeRef={null}
              ringRef={null}
              large={false}
            />
            <p className="ft-timer__setup-label">{formatTime(duration)}</p>
            <button type="button" className="ft-btn ft-btn--primary ft-timer__launch" onClick={handleStart}>
              {t('timer.start')}
            </button>
          </>
        )}
      </div>

      <TimerFocusModal
        open={focused}
        remaining={remaining}
        duration={duration}
        running={running}
        done={done}
        onReset={handleReset}
        onStart={handleStart}
        onPause={() => setRunning(false)}
        onAdd15={handleAdd15}
        onClose={handleClose}
        timeRef={timeRef}
        ringRef={ringRef}
        t={t}
      />
    </>
  )
}
