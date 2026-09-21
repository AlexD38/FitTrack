import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { muscleLabel } from '../lib/i18n'
import { sessionVolume } from '../lib/stats'
import { getMuscleColor } from '../lib/muscles'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'
import { BodyMuscleMap } from './BodyMuscleMap'

export function SessionCard({ session, expanded, onToggle, onEdit, onReplay, children }) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS
  const dateStr = format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: dateLocale })
  const vol = sessionVolume(session)
  const exCount = session.exercises?.length ?? 0
  const muscles = session.muscles ?? []

  return (
    <article
      className={`ft-glass ft-glass--pad ft-session-card ft-stagger-item${expanded ? ' ft-session-card--expanded' : ''}`}
    >
      <button
        type="button"
        className="ft-session-card__summary"
        onClick={() => onToggle?.(session)}
        aria-expanded={expanded}
      >
        <div className="ft-session-card__summary-main">
          <p className="ft-session-card__date">{dateStr}</p>
          <div className="ft-session-card__meta">
            <span>
              {exCount} {t('common.exercises')}
            </span>
            <span>
              {t('common.volume')}: {vol.toLocaleString()} kg
            </span>
          </div>
          {muscles.length > 0 && (
            <div className="ft-session-card__chips">
              {muscles.map((m) => (
                <span
                  key={m}
                  className="ft-chip"
                  style={{ borderColor: getMuscleColor(m), color: getMuscleColor(m) }}
                >
                  {muscleLabel(locale, m)}
                </span>
              ))}
            </div>
          )}
        </div>
        <span
          className={`ft-session-card__chevron${expanded ? ' ft-session-card__chevron--open' : ''}`}
          aria-hidden="true"
        >
          <FaIcon icon={uiIcons.chevronDown} className="ft-session-card__chevron-icon" />
        </span>
      </button>

      {muscles.length > 0 && (
        <BodyMuscleMap active={muscles} size="sm" className="ft-session-card__body" />
      )}

      <div className="ft-session-card__bar" role="group" aria-label={t('journal.sessionDetail')}>
        {onReplay && (
          <button
            type="button"
            className="ft-session-card__action ft-session-card__action--play"
            onClick={() => onReplay(session)}
          >
            <FaIcon icon={uiIcons.play} className="ft-session-card__action-icon" />
            <span>{t('live.replay')}</span>
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            className="ft-session-card__action ft-session-card__action--edit"
            onClick={() => onEdit(session)}
          >
            <FaIcon icon={uiIcons.edit} className="ft-session-card__action-icon" />
            <span>{t('common.edit')}</span>
          </button>
        )}
      </div>

      {expanded && children && <div className="ft-session-card__detail">{children}</div>}
    </article>
  )
}
