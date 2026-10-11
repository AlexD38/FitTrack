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
  const previewExercises = (session.exercises ?? []).slice(0, 3)

  return (
    <article
      className={`ft-session-card ft-stagger-item ft-session-card--clickable${
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
            <div className="ft-session-card__date-group">
              <p className="ft-session-card__date">{dateStr}</p>
              {session.durationSeconds > 0 && (
                <span className="ft-session-card__duration-badge">
                  {formatDuration(session.durationSeconds)}
                </span>
              )}
            </div>
            <span className={`ft-status-tag ft-status-tag--${status}`}>{t(statusTagKey(status))}</span>
          </div>

          <div className="ft-session-card__metrics">
            <span className="ft-session-card__metric-item">
              <strong>{exCount}</strong> {t('common.exercises')}
            </span>
            <span className="ft-session-card__metric-sep">·</span>
            <span className="ft-session-card__metric-item">
              <strong>{vol.toLocaleString()}</strong> {t('common.kg')}
            </span>
          </div>

          {previewExercises.length > 0 && (
            <div className="ft-session-card__preview-list">
              {previewExercises.map((ex, idx) => {
                const setsCount = ex.sets?.length ?? 0
                return (
                  <div key={idx} className="ft-session-card__preview-item">
                    <span className="ft-session-card__preview-bullet" />
                    <span className="ft-session-card__preview-name">{ex.name || t('journal.exerciseName')}</span>
                    {setsCount > 0 && (
                      <span className="ft-session-card__preview-sets">
                        {setsCount} {t('common.sets')}
                      </span>
                    )}
                  </div>
                )
              })}
              {session.exercises?.length > 3 && (
                <span className="ft-session-card__preview-more">
                  +{session.exercises.length - 3} {t('common.exercises')}
                </span>
              )}
            </div>
          )}

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
