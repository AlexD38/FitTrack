import { useCallback, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { TimeRollPicker, partsToSeconds, secondsToParts } from '../components/TimeRollPicker'
import { RestTimerModal, TimerRing, formatRestTime, useRestTimer } from '../components/RestTimer'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'

const PRESETS = [
  { seconds: 60, labelKey: 'timer.preset1' },
  { seconds: 90, labelKey: 'timer.preset2' },
  { seconds: 105, labelKey: 'timer.preset145' },
  { seconds: 120, labelKey: 'timer.preset3' },
  { seconds: 150, labelKey: 'timer.preset4' },
]

export function TimerPage({ onOpenSettings }) {
  const { settings } = useFitness()
  const { t } = useLocale()
  const initial = settings.defaultRestSeconds ?? 90
  const timer = useRestTimer(initial)
  const [customOpen, setCustomOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(
    PRESETS.some((p) => p.seconds === initial) ? initial : null,
  )
  const [rollParts, setRollParts] = useState(() => secondsToParts(initial))

  const applyDuration = useCallback(
    (seconds, preset = null) => {
      timer.applyDuration(seconds)
      setRollParts(secondsToParts(Math.max(5, Math.min(seconds, 330))))
      setActivePreset(preset)
    },
    [timer],
  )

  const handleRollChange = (minutes, seconds) => {
    const total = partsToSeconds(minutes, seconds)
    if (total === 0) return
    applyDuration(total, null)
  }

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
              disabled={timer.focused}
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
          disabled={timer.focused}
        >
          <span>{t('timer.custom')}</span>
          <span className="ft-timer__custom-chevron" aria-hidden="true">
            {customOpen ? '▲' : '▼'}
          </span>
        </button>

        {customOpen && !timer.focused && (
          <TimeRollPicker
            minutes={rollParts.minutes}
            seconds={rollParts.seconds}
            onChange={handleRollChange}
            disabled={timer.focused}
          />
        )}

        {!timer.focused && (
          <>
            <TimerRing
              remaining={timer.remaining}
              duration={timer.duration}
              done={false}
              timeRef={null}
              ringRef={null}
              large={false}
            />
            <p className="ft-timer__setup-label">{formatRestTime(timer.duration)}</p>
            <button
              type="button"
              className="ft-btn ft-btn--primary ft-timer__launch"
              onClick={timer.handleStart}
            >
              {t('timer.start')}
            </button>
          </>
        )}
      </div>

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
    </>
  )
}
