import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { PROGRAM_TEMPLATES, templateToSession } from '../lib/templates'
import { useLocale } from '../contexts/LocaleContext'
import { muscleLabel } from '../lib/i18n'
import { sessionVolume } from '../lib/stats'
import { uiIcons } from '../lib/icons'
import { BodyMuscleMap } from './BodyMuscleMap'
import { FaIcon } from './FaIcon'

function SessionPickList({ sessions, onPick, favorite = false }) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS
  return (
    <ul className="ft-templates__past-list">
      {sessions.map((session) => {
        const dateStr = format(parseISO(session.date), 'EEE d MMM', { locale: dateLocale })
        const exCount = session.exercises?.length ?? 0
        const vol = sessionVolume(session)
        const muscles = session.muscles ?? []
        const detailText = favorite
          ? (session.exercises ?? [])
              .map((ex) => ex.name)
              .filter(Boolean)
              .slice(0, 3)
              .join(' · ')
          : muscles
              .slice(0, 3)
              .map((m) => muscleLabel(locale, m))
              .join(' · ')
        return (
          <li key={session.id}>
            <button
              type="button"
              className={`ft-template-past${favorite ? ' ft-template-past--favorite' : ''}`}
              onClick={() => onPick(session)}
            >
              <span className="ft-template-past__text">
                <span className="ft-template-past__date">
                  {favorite && (
                    <FaIcon icon={uiIcons.star} className="ft-template-past__star" />
                  )}
                  {dateStr}
                </span>
                <span className="ft-template-past__meta">
                  {exCount} {t('common.exercises')} · {vol.toLocaleString()} kg
                </span>
                {detailText && <span className="ft-template-past__muscles">{detailText}</span>}
              </span>
              {muscles.length > 0 && (
                <BodyMuscleMap active={muscles} size="xs" className="ft-template-past__body" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function TemplatePicker({
  onSelect,
  onCustom,
  onSelectPast,
  pastSessions = [],
  favoriteSessions = [],
  hideHeader = false,
}) {
  const { locale, t } = useLocale()
  const recent = pastSessions.filter((s) => !s.favorite).slice(0, 8)

  return (
    <section className={`ft-templates${hideHeader ? ' ft-templates--sheet' : ''}`}>
      {!hideHeader && (
        <>
          <h2 className="ft-section__title">{t('templates.title')}</h2>
          <p className="ft-templates__hint">{t('templates.hint')}</p>
        </>
      )}

      {onSelectPast && favoriteSessions.length > 0 && (
        <div className="ft-templates__favorites">
          <h3 className="ft-templates__past-title">{t('templates.favorites')}</h3>
          <p className="ft-templates__hint">{t('templates.favoritesHint')}</p>
          <SessionPickList sessions={favoriteSessions} onPick={onSelectPast} favorite />
        </div>
      )}

      <div className="ft-templates__grid">
        {onCustom && (
          <button
            type="button"
            className="ft-template-card ft-template-card--custom"
            onClick={onCustom}
          >
            <span className="ft-template-card__text">
              <span className="ft-template-card__name">{t('templates.custom')}</span>
              <span className="ft-template-card__meta">{t('templates.customMeta')}</span>
              <span className="ft-template-card__muscles">{t('templates.customHint')}</span>
            </span>
          </button>
        )}
        {PROGRAM_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="ft-template-card"
            onClick={() => onSelect(templateToSession(tpl, locale))}
          >
            <span className="ft-template-card__text">
              <span className="ft-template-card__name">{t(`templates.${tpl.id}`)}</span>
              <span className="ft-template-card__meta">
                {tpl.exercises.length} {t('common.exercises')}
              </span>
              <span className="ft-template-card__muscles">
                {tpl.muscles.map((m) => muscleLabel(locale, m)).join(' · ')}
              </span>
            </span>
            <BodyMuscleMap active={tpl.muscles} size="xs" className="ft-template-card__body" />
          </button>
        ))}
      </div>

      {onSelectPast && recent.length > 0 && (
        <div className="ft-templates__past">
          <h3 className="ft-templates__past-title">{t('templates.past')}</h3>
          <p className="ft-templates__hint">{t('templates.pastHint')}</p>
          <SessionPickList sessions={recent} onPick={onSelectPast} />
        </div>
      )}
    </section>
  )
}
