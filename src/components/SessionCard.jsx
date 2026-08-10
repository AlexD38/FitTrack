import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { muscleLabel } from '../lib/i18n'
import { sessionVolume } from '../lib/stats'
import { getMuscleColor } from '../lib/muscles'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'

export function SessionCard({ session, expanded, onToggle, children }) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS
  const dateStr = format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: dateLocale })
  const vol = sessionVolume(session)
  const exCount = session.exercises?.length ?? 0

  return (
    <article
      className={`ft-glass ft-glass--pad ft-session-card ft-stagger-item${expanded ? ' ft-session-card--expanded' : ''}`}
    >
      <div className="ft-session-card__top">
        <button type="button" className="ft-session-card__summary" onClick={() => onToggle?.(session)} aria-expanded={expanded}>
          <p className="ft-session-card__date">{dateStr}</p>
          <div className="ft-session-card__meta">
            <span>
              {exCount} {t('common.exercises')}
            </span>
            <span>
              {t('common.volume')}: {vol.toLocaleString()} kg
            </span>
          </div>
          <div className="ft-session-card__chips">
            {(session.muscles ?? []).map((m) => (
              <span
                key={m}
                className="ft-chip"
                style={{ borderColor: getMuscleColor(m), color: getMuscleColor(m) }}
              >
                {muscleLabel(locale, m)}
              </span>
            ))}
          </div>
        </button>
        <button
          type="button"
          className={`ft-session-card__chevron${expanded ? ' ft-session-card__chevron--open' : ''}`}
          onClick={() => onToggle?.(session)}
          aria-label={expanded ? t('common.close') : t('journal.sessionDetail')}
          aria-expanded={expanded}
        >
          <FaIcon icon={uiIcons.chevronDown} className="ft-session-card__chevron-icon" />
        </button>
      </div>

      {expanded && children && <div className="ft-session-card__detail">{children}</div>}
    </article>
  )
}
