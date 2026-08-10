import { useLocale } from '../contexts/LocaleContext'

/** Green (easy) → yellow → orange → red (max effort) */
export const RPE_GRADIENT =
  'linear-gradient(90deg, #22c55e 0%, #84cc16 22%, #eab308 45%, #f97316 70%, #ef4444 100%)'

export function rpeColor(value) {
  const n = Number(value)
  if (!n || n < 1) return '#94a3b8'
  if (n <= 3) return '#22c55e'
  if (n <= 5) return '#84cc16'
  if (n <= 7) return '#eab308'
  if (n <= 8) return '#f97316'
  return '#ef4444'
}

export function RpeGauge({ value, onChange }) {
  const { t } = useLocale()
  const numeric = value === '' || value == null ? null : Number(value)
  const sliderValue = numeric != null && !Number.isNaN(numeric) ? numeric : 5
  const display = numeric != null && !Number.isNaN(numeric) ? String(numeric) : '—'
  const thumb = rpeColor(numeric ?? sliderValue)

  return (
    <div className="ft-rpe">
      <div className="ft-rpe__head">
        <span className="ft-rpe__label">{t('rpe.label')}</span>
        <span className="ft-rpe__value" style={{ color: thumb }}>
          {display}
        </span>
      </div>
      <div className="ft-rpe__track" style={{ '--ft-rpe-thumb': thumb }}>
        <div className="ft-rpe__gradient" style={{ background: RPE_GRADIENT }} aria-hidden="true" />
        <input
          className="ft-rpe__input"
          type="range"
          min={1}
          max={10}
          step={1}
          value={sliderValue}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={t('rpe.label')}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={sliderValue}
        />
      </div>
      <div className="ft-rpe__ends" aria-hidden="true">
        <span>{t('rpe.easy')}</span>
        <span>{t('rpe.hard')}</span>
      </div>
    </div>
  )
}
