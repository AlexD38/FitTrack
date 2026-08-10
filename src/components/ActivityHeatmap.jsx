import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { buildHeatmap, computeStreaks } from '../lib/streaks'
import { useLocale } from '../contexts/LocaleContext'
import { GlassCard } from './GlassCard'

const WEEKDAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKDAYS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function ActivityHeatmap({ sessions }) {
  const { locale, t } = useLocale()
  const streaks = useMemo(() => computeStreaks(sessions), [sessions])
  const cells = useMemo(() => buildHeatmap(sessions, 16), [sessions])
  const dateLocale = locale === 'fr' ? fr : enUS
  const weekdays = locale === 'fr' ? WEEKDAYS_FR : WEEKDAYS_EN

  // Organize into columns (weeks), each column Mon→Sun
  const weeks = []
  let col = []
  for (const cell of cells) {
    // startOfWeek Monday — first cells may need padding if we want strict columns
    col.push(cell)
    if (col.length === 7) {
      weeks.push(col)
      col = []
    }
  }
  if (col.length) weeks.push(col)

  return (
    <section className="ft-section ft-glass ft-glass--pad">
      <div className="ft-section__head">
        <h2 className="ft-section__title">{t('streaks.title')}</h2>
      </div>

      <div className="ft-streak-kpis">
        <GlassCard className="ft-streak-kpi">
          <p className="ft-streak-kpi__value">{streaks.current}</p>
          <p className="ft-streak-kpi__label">{t('streaks.current')}</p>
        </GlassCard>
        <GlassCard className="ft-streak-kpi">
          <p className="ft-streak-kpi__value">{streaks.best}</p>
          <p className="ft-streak-kpi__label">{t('streaks.best')}</p>
        </GlassCard>
        <GlassCard className="ft-streak-kpi">
          <p className="ft-streak-kpi__value">{streaks.totalDays}</p>
          <p className="ft-streak-kpi__label">{t('streaks.total')}</p>
        </GlassCard>
      </div>

      <div className="ft-heatmap">
        <div className="ft-heatmap__dow" aria-hidden="true">
          {weekdays.map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="ft-heatmap__grid" role="img" aria-label={t('streaks.heatmap')}>
          {weeks.map((week, wi) => (
            <div key={wi} className="ft-heatmap__week">
              {Array.from({ length: 7 }, (_, di) => {
                const cell = week[di]
                if (!cell) {
                  return <span key={di} className="ft-heatmap__cell ft-heatmap__cell--empty" />
                }
                const title = `${format(parseISO(cell.date), 'd MMM yyyy', { locale: dateLocale })}: ${cell.count}`
                return (
                  <span
                    key={cell.date}
                    className={`ft-heatmap__cell ft-heatmap__cell--l${cell.level}`}
                    title={title}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ft-heatmap__legend">
        <span>{t('streaks.less')}</span>
        {[0, 1, 2, 3].map((l) => (
          <span key={l} className={`ft-heatmap__cell ft-heatmap__cell--l${l}`} />
        ))}
        <span>{t('streaks.more')}</span>
      </div>
    </section>
  )
}
