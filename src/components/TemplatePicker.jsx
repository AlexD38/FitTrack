import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { PROGRAM_TEMPLATES, templateToSession } from '../lib/templates'
import { useLocale } from '../contexts/LocaleContext'
import { muscleLabel } from '../lib/i18n'
import { sessionVolume } from '../lib/stats'

export function TemplatePicker({
  onSelect,
  onCustom,
  onSelectPast,
  pastSessions = [],
  hideHeader = false,
}) {
  const { locale, t } = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS
  const recent = pastSessions.slice(0, 8)

  return (
    <section className={`ft-templates${hideHeader ? ' ft-templates--sheet' : ''}`}>
      {!hideHeader && (
        <>
          <h2 className="ft-section__title">{t('templates.title')}</h2>
          <p className="ft-templates__hint">{t('templates.hint')}</p>
        </>
      )}

      <div className="ft-templates__grid">
        {onCustom && (
          <button
            type="button"
            className="ft-template-card ft-template-card--custom"
            onClick={onCustom}
          >
            <span className="ft-template-card__name">{t('templates.custom')}</span>
            <span className="ft-template-card__meta">{t('templates.customMeta')}</span>
            <span className="ft-template-card__muscles">{t('templates.customHint')}</span>
          </button>
        )}
        {PROGRAM_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            className="ft-template-card"
            onClick={() => onSelect(templateToSession(tpl, locale))}
          >
            <span className="ft-template-card__name">{t(`templates.${tpl.id}`)}</span>
            <span className="ft-template-card__meta">
              {tpl.exercises.length} {t('common.exercises')}
            </span>
            <span className="ft-template-card__muscles">
              {tpl.muscles.map((m) => muscleLabel(locale, m)).join(' · ')}
            </span>
          </button>
        ))}
      </div>

      {onSelectPast && recent.length > 0 && (
        <div className="ft-templates__past">
          <h3 className="ft-templates__past-title">{t('templates.past')}</h3>
          <p className="ft-templates__hint">{t('templates.pastHint')}</p>
          <ul className="ft-templates__past-list">
            {recent.map((session) => {
              const dateStr = format(parseISO(session.date), 'EEE d MMM', { locale: dateLocale })
              const exCount = session.exercises?.length ?? 0
              const vol = sessionVolume(session)
              const muscles = (session.muscles ?? [])
                .slice(0, 3)
                .map((m) => muscleLabel(locale, m))
                .join(' · ')
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="ft-template-past"
                    onClick={() => onSelectPast(session)}
                  >
                    <span className="ft-template-past__date">{dateStr}</span>
                    <span className="ft-template-past__meta">
                      {exCount} {t('common.exercises')} · {vol.toLocaleString()} kg
                    </span>
                    {muscles && (
                      <span className="ft-template-past__muscles">{muscles}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
