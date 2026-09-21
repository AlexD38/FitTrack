import { muscleLabel } from '../lib/i18n'
import { ANTERIOR_PARTS, POSTERIOR_PARTS, BODY_VIEWBOX } from '../lib/bodyMapData'
import { useLocale } from '../contexts/LocaleContext'

function BodyView({ parts, active, label }) {
  return (
    <svg viewBox={BODY_VIEWBOX} className="ft-body-map__svg" aria-hidden="true">
      {parts.map((part, partIdx) =>
        part.points.map((points, i) => {
          const isMuscle = Boolean(part.group)
          const on = isMuscle && active.has(part.group)
          const className = isMuscle
            ? `ft-body-map__part${on ? ' ft-body-map__part--active' : ''}`
            : 'ft-body-map__base'
          return (
            <polygon
              key={`${part.group ?? 'base'}-${partIdx}-${i}`}
              points={points}
              className={className}
              data-muscle={part.group ?? undefined}
            >
              {isMuscle && i === 0 ? <title>{label(part.group)}</title> : null}
            </polygon>
          )
        }),
      )}
    </svg>
  )
}

/**
 * Anatomical front/back body map (polygons from react-body-highlighter, MIT).
 * Highlights FitTrack muscle group ids; cardio has no region.
 */
export function BodyMuscleMap({ active = [], size = 'md', className = '' }) {
  const { locale, t } = useLocale()
  const activeSet = new Set((active ?? []).filter((id) => id && id !== 'cardio'))
  const label = (id) => muscleLabel(locale, id)

  return (
    <div
      className={`ft-body-map ft-body-map--${size}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={
        activeSet.size
          ? `${t('journal.muscles')}: ${[...activeSet].map(label).join(', ')}`
          : t('journal.muscles')
      }
    >
      <div className="ft-body-map__panel">
        <span className="ft-body-map__caption">{t('body.front')}</span>
        <BodyView parts={ANTERIOR_PARTS} active={activeSet} label={label} />
      </div>
      <div className="ft-body-map__panel">
        <span className="ft-body-map__caption">{t('body.back')}</span>
        <BodyView parts={POSTERIOR_PARTS} active={activeSet} label={label} />
      </div>
    </div>
  )
}
