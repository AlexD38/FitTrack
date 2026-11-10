import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

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

function clampRpe(value) {
  const n = value === '' || value == null || Number.isNaN(Number(value)) ? 5 : Number(value)
  return Math.min(10, Math.max(1, n))
}

const FLAME_COUNT = 5
/** Hue shift applied to the 🔥 emoji (natively orange) so the five flames run green → red. */
const FLAME_HUES = [85, 50, 28, 10, -15]

/**
 * RPE as five flames, each worth 2 points: a full flame is an even value, a half flame the odd one
 * below it. Tapping a flame lights it fully; tapping it again drops it to half.
 */
export function RpeFlames({ value, onChange, ariaLabel }) {
  const { t } = useLocale()
  const numeric = clampRpe(value)
  const label = ariaLabel ?? t('rpe.label')

  return (
    <div className="ft-flames" role="group" aria-label={`${label}: ${numeric}/10`}>
      {Array.from({ length: FLAME_COUNT }, (_, i) => {
        const full = (i + 1) * 2
        const level = numeric >= full ? 'full' : numeric === full - 1 ? 'half' : 'empty'
        const next = numeric === full ? full - 1 : full
        return (
          <button
            key={i}
            type="button"
            className={`ft-flame ft-flame--${level}`}
            style={{ '--flame-hue': `${FLAME_HUES[i]}deg` }}
            onClick={() => onChange(next)}
            aria-label={`${label} ${next}`}
          >
            <span className="ft-flame__base" aria-hidden="true">🔥</span>
            <span className="ft-flame__fill" aria-hidden="true">🔥</span>
          </button>
        )
      })}
    </div>
  )
}

export function RpeGauge({ value, onChange, iconColor }) {
  const { t } = useLocale()
  const numeric = clampRpe(value)
  const thumb = rpeColor(numeric)
  const iconTint = iconColor ?? thumb
  const pct = ((numeric - 1) / 9) * 100

  return (
    <div
      className="ft-rpe"
      style={{
        '--ft-rpe-thumb': thumb,
        '--ft-rpe-pct': `${pct}%`,
      }}
    >
      <div className="ft-rpe__head">
        <span className="ft-rpe__label">
          <span className="ft-rpe__icon-wrap" style={{ color: iconTint, background: `${iconTint}22` }}>
            <FaIcon icon={uiIcons.rpe} className="ft-rpe__icon" />
          </span>
          {t('rpe.label')}
        </span>
        <span className="ft-rpe__value" style={{ color: thumb, background: `${thumb}1f` }}>
          {numeric}
        </span>
      </div>

      <div className="ft-rpe__track">
        <div className="ft-rpe__rail" aria-hidden="true">
          <div className="ft-rpe__gradient" style={{ background: RPE_GRADIENT }} />
          <div className="ft-rpe__glow" />
        </div>
        <input
          className="ft-rpe__input"
          type="range"
          min={1}
          max={10}
          step={1}
          value={numeric}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={t('rpe.label')}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={numeric}
        />
      </div>

      <div className="ft-rpe__scale" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i + 1}
            className={`ft-rpe__tick${i + 1 === numeric ? ' ft-rpe__tick--active' : ''}`}
            style={i + 1 === numeric ? { color: thumb } : undefined}
          >
            {i + 1}
          </span>
        ))}
      </div>

      <div className="ft-rpe__ends" aria-hidden="true">
        <span>{t('rpe.easy')}</span>
        <span>{t('rpe.hard')}</span>
      </div>
    </div>
  )
}
