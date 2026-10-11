import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { muscleLabel } from '../lib/i18n'
import { sessionVolume } from '../lib/stats'
import { getMuscleColor } from '../lib/muscles'
import { useLocale } from '../contexts/LocaleContext'
import { FaIcon } from './FaIcon'
import { uiIcons } from '../lib/icons'
import { normalizeSessionStatus, statusTagKey } from '../lib/sessionStatus'
import { formatDuration } from '../lib/duration'

const MAX_MUSCLE_CHIPS = 3

export function SessionCard({ session, pinned = false, onOpen, onReplay, onDelete, primaryLabel }) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS
  const dateStr = format(parseISO(session.date), 'EEE d MMM', { locale: dateLocale })
  const vol = sessionVolume(session)
  const exCount = session.exercises?.length ?? 0
  const muscles = session.muscles ?? []
  const status = normalizeSessionStatus(session.status)
  const visibleMuscles = muscles.slice(0, MAX_MUSCLE_CHIPS)
  const extraMuscles = Math.max(0, muscles.length - MAX_MUSCLE_CHIPS)

  return (
    <article
      className={`ft-glass ft-glass--pad ft-session-card ft-stagger-item ft-session-card--clickable${
        pinned ? ' ft-session-card--pinned' : ''
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(session)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.(session)
        }
      }}
    >
      <div className="ft-session-card__row">
        <div className="ft-session-card__main">
          <div className="ft-session-card__title-row">
            <p className="ft-session-card__date">{dateStr}</p>
            <span className={`ft-status-tag ft-status-tag--${status}`}>{t(statusTagKey(status))}</span>
          </div>
          <p className="ft-session-card__meta">
            {exCount} {t('common.exercises')} · {vol.toLocaleString()} {t('common.kg')}
            {session.durationSeconds > 0 ? ` · ${formatDuration(session.durationSeconds)}` : ''}
          </p>
          {visibleMuscles.length > 0 && (
            <div className="ft-session-card__chips">
              {visibleMuscles.map((m) => (
                <span
                  key={m}
                  className="ft-chip ft-chip--sm"
                  style={{ borderColor: getMuscleColor(m), color: getMuscleColor(m) }}
                >
                  {muscleLabel(locale, m)}
                </span>
              ))}
              {extraMuscles > 0 && (
                <span className="ft-chip ft-chip--sm ft-session-card__more">+{extraMuscles}</span>
              )}
            </div>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            className="ft-session-card__icon-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(session)
            }}
            aria-label={t('common.delete')}
          >
            <FaIcon icon={uiIcons.trash} className="ft-session-card__icon-btn-icon" />
          </button>
        )}
      </div>

      {onReplay && (
        <div
          className="ft-session-card__cta-wrap"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={`ft-btn ft-session-card__cta${
              pinned ? ' ft-btn--primary' : ' ft-btn--secondary'
            }`}
            onClick={() => onReplay(session)}
          >
            <FaIcon icon={uiIcons.play} className="ft-session-card__action-icon" />
            <span>{primaryLabel ?? t('live.replay')}</span>
          </button>
        </div>
      )}
    </article>
  )
}
