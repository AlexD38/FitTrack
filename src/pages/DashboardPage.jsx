import { useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { EmptyState } from '../components/EmptyState'
import { VolumeChart } from '../components/charts/VolumeChart'
import { ExerciseProgressChart } from '../components/charts/ExerciseProgressChart'
import { Sparkline } from '../components/charts/Sparkline'
import { TOUR_KEY } from '../components/OnboardingTour'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { exerciseProgressSeries, weightSeries } from '../lib/stats'
import { exerciseTrends, percentChange, recentRecords, weeklyBuckets } from '../lib/progress'
import { findActiveSession, statsSessionsOnly } from '../lib/sessionStatus'
import { FaIcon } from '../components/FaIcon'
import { uiIcons } from '../lib/icons'

const ONBOARDING_KEY = 'ft-onboarding-seen'
const VOLUME_WEEKS = 12

/** Signed change pill; `tone` is good / bad / neutral. */
function Delta({ children, tone = 'neutral' }) {
  return <span className={`ft-delta ft-delta--${tone}`}>{children}</span>
}

function toneOf(value) {
  if (!value) return 'neutral'
  return value > 0 ? 'good' : 'bad'
}

function signed(n, nf) {
  if (n > 0) return `+${nf.format(n)}`
  if (n < 0) return `−${nf.format(Math.abs(n))}`
  return '='
}

function Stat({ label, value, unit, delta, caption }) {
  return (
    <div className="ft-dash-stat">
      <p className="ft-dash-stat__label">{label}</p>
      <p className="ft-dash-stat__value">
        {value}
        {unit && <span className="ft-dash-stat__unit">{unit}</span>}
      </p>
      <p className="ft-dash-stat__caption">
        {delta}
        {caption}
      </p>
    </div>
  )
}

export function DashboardPage({ onOpenSettings, onGoJournal, onGoWeight }) {
  const { sessions, weightEntries, settings } = useFitness()
  const { locale, t } = useLocale()
  const nf = useMemo(() => new Intl.NumberFormat(locale === 'en' ? 'en' : 'fr', { maximumFractionDigits: 1 }), [locale])
  const statsSessions = useMemo(() => statsSessionsOnly(sessions), [sessions])
  const activeSession = useMemo(() => findActiveSession(sessions), [sessions])
  const isFresh = statsSessions.length === 0
  const [openExercise, setOpenExercise] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      // Skip tip banner if the 3-screen tour already covered first-run guidance
      if (localStorage.getItem(TOUR_KEY) === '1') return false
      return localStorage.getItem(ONBOARDING_KEY) !== '1'
    } catch {
      return true
    }
  })

  const dismissOnboarding = () => {
    setShowOnboarding(false)
    try {
      localStorage.setItem(ONBOARDING_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const weeks = useMemo(() => weeklyBuckets(statsSessions, VOLUME_WEEKS, locale), [statsSessions, locale])
  const thisWeek = weeks[weeks.length - 1]
  const lastWeek = weeks[weeks.length - 2]
  // Trend over complete weeks only: the current week is still being filled.
  const recent4 = weeks.slice(-5, -1).reduce((sum, w) => sum + w.volume, 0)
  const previous4 = weeks.slice(-9, -5).reduce((sum, w) => sum + w.volume, 0)
  const volumeTrend = percentChange(recent4, previous4)
  const weekVolumePct = percentChange(thisWeek.volume, lastWeek.volume)
  const sessionDelta = thisWeek.count - lastWeek.count

  const trends = useMemo(() => exerciseTrends(statsSessions, { days: 90, limit: 5 }), [statsSessions])
  const records = useMemo(() => recentRecords(statsSessions, 30), [statsSessions])

  const unit = settings.weightUnit ?? 'kg'
  const weightData = weightSeries(weightEntries, 90)
  const currentWeight = weightData.length ? weightData[weightData.length - 1].weight : null
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const weightBase = weightData.filter((p) => p.date <= monthAgo).pop() ?? weightData[0]
  const weightChange = currentWeight != null && weightBase ? currentWeight - weightBase.weight : 0
  const goal = settings.weightGoal
  // Without a goal a weight change is neither good nor bad; with one, getting closer is good.
  const weightTone =
    goal == null || !weightChange
      ? 'neutral'
      : Math.abs(currentWeight - goal) < Math.abs(weightBase.weight - goal)
        ? 'good'
        : 'bad'

  const goalEntries = Object.entries(settings.exerciseGoals ?? {})

  const valueText = (trend, value) => {
    if (trend.metric === 'reps') return `${nf.format(value)} ${t('common.reps')}`
    return trend.bodyweight ? `${t('journal.bodyweight')} +${nf.format(value)} kg` : `${nf.format(value)} kg`
  }

  return (
    <>
      <PageHeader title={t('dashboard.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      {showOnboarding && !isFresh && (
        <div className="ft-onboarding" role="note">
          <div className="ft-onboarding__text">
            <p className="ft-onboarding__title">{t('dashboard.onboardingTitle')}</p>
            <p className="ft-onboarding__body">{t('dashboard.onboardingBody')}</p>
          </div>
          <button type="button" className="ft-btn ft-btn--secondary ft-onboarding__dismiss" onClick={dismissOnboarding}>
            {t('common.gotIt')}
          </button>
        </div>
      )}

      {isFresh ? (
        <section className="ft-section ft-glass ft-glass--pad ft-dashboard-hero">
          <EmptyState
            title={t('dashboard.getStartedTitle')}
            message={t('dashboard.getStarted')}
            actionLabel={t('live.startBlank')}
            onAction={onGoJournal}
          />
        </section>
      ) : (
        <>
          <button
            type="button"
            className="ft-quick__primary ft-dashboard-start"
            onClick={() => onGoJournal?.(activeSession ? 'resume' : undefined)}
          >
            <span className="ft-quick__primary-icon" aria-hidden="true">
              <FaIcon icon={uiIcons.play} />
            </span>
            <span className="ft-quick__primary-text">
              <span className="ft-quick__primary-title">
                {activeSession ? t('dashboard.resumeWorkout') : t('dashboard.startWorkout')}
              </span>
              <span className="ft-quick__primary-meta">
                {activeSession ? t('live.title') : t('templates.startHint')}
              </span>
            </span>
          </button>

          <section className="ft-dash-stats ft-glass" aria-label={t('dashboard.thisWeek')}>
            <Stat
              label={t('dashboard.sessionsWeek')}
              value={thisWeek.count}
              delta={<Delta tone={toneOf(sessionDelta)}>{signed(sessionDelta, nf)}</Delta>}
              caption={t('dashboard.vsLastWeek')}
            />
            <Stat
              label={t('dashboard.weekVolume')}
              value={nf.format(Math.round(thisWeek.volume))}
              unit="kg"
              delta={
                weekVolumePct != null && (
                  <Delta tone={toneOf(weekVolumePct)}>{`${signed(weekVolumePct, nf)} %`}</Delta>
                )
              }
              caption={t('dashboard.vsLastWeek')}
            />
            <Stat
              label={t('dashboard.records')}
              value={records}
              caption={t('dashboard.last30Days')}
            />
          </section>

          <section className="ft-section ft-glass ft-glass--pad">
            <div className="ft-dash-head">
              <div>
                <h2 className="ft-section__title">{t('dashboard.volumeTrend')}</h2>
                <p className="ft-dash-head__sub">{t('dashboard.last12Weeks')}</p>
              </div>
              {volumeTrend != null && (
                <Delta tone={toneOf(volumeTrend)}>
                  {signed(volumeTrend, nf)} % · {t('dashboard.fourWeeks')}
                </Delta>
              )}
            </div>
            {weeks.some((w) => w.volume > 0) ? (
              <VolumeChart data={weeks} />
            ) : (
              <EmptyState message={t('dashboard.noVolume')} />
            )}
          </section>

          <section className="ft-section ft-glass ft-glass--pad">
            <div className="ft-dash-head">
              <div>
                <h2 className="ft-section__title">{t('dashboard.progressTitle')}</h2>
                <p className="ft-dash-head__sub">{t('dashboard.progressHint')}</p>
              </div>
            </div>
            {trends.length === 0 ? (
              <EmptyState message={t('dashboard.noExercises')} />
            ) : (
              <ul className="ft-trend-list">
                {trends.map((trend) => {
                  const open = openExercise === trend.key
                  const deltaUnit = trend.metric === 'reps' ? ` ${t('common.reps')}` : ' kg'
                  return (
                    <li key={trend.key} className={`ft-trend${open ? ' ft-trend--open' : ''}`}>
                      <button
                        type="button"
                        className="ft-trend__row"
                        onClick={() => setOpenExercise(open ? null : trend.key)}
                        aria-expanded={open}
                      >
                        <span className="ft-trend__text">
                          <span className="ft-trend__name">{trend.name}</span>
                          <span className="ft-trend__meta">
                            {valueText(trend, trend.current)} · {trend.series.length} {t('dashboard.sessionsShort')}
                          </span>
                        </span>
                        <Sparkline
                          className="ft-trend__spark"
                          values={trend.series.map((p) => p.value)}
                          color={trend.delta < 0 ? 'var(--color-negative)' : 'var(--color-positive)'}
                        />
                        <Delta tone={toneOf(trend.delta)}>
                          {trend.delta ? `${signed(trend.delta, nf)}${deltaUnit}` : '='}
                        </Delta>
                      </button>
                      {open && (
                        <div className="ft-trend__detail">
                          <ExerciseProgressChart
                            data={trend.series.map((p) => ({ date: p.date, weight: p.value }))}
                            unit={trend.metric === 'reps' ? t('common.reps') : 'kg'}
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {goalEntries.length > 0 && (
            <section className="ft-section ft-glass ft-glass--pad">
              <div className="ft-section__head">
                <h2 className="ft-section__title">{t('dashboard.forceGoals')}</h2>
              </div>
              {goalEntries.map(([name, target]) => {
                const series = exerciseProgressSeries(statsSessions, name)
                const max = series.length ? Math.max(...series.map((p) => p.weight)) : 0
                const pct = target ? Math.min(100, Math.round((max / target) * 100)) : 0
                return (
                  <div key={name} className="ft-force-goal">
                    <div className="ft-force-goal__head">
                      <span>{name}</span>
                      <span>
                        {max}/{target} kg
                      </span>
                    </div>
                    <div className="ft-force-goal__bar">
                      <div className="ft-force-goal__fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-dash-head">
          <div>
            <h2 className="ft-section__title">{t('dashboard.bodyWeight')}</h2>
            <p className="ft-dash-head__sub">{t('dashboard.last90Days')}</p>
          </div>
        </div>
        {currentWeight == null ? (
          <EmptyState message={t('dashboard.noWeight')} actionLabel={t('weight.addEntry')} onAction={onGoWeight} />
        ) : (
          <button type="button" className="ft-dash-weight" onClick={onGoWeight}>
            <span className="ft-dash-weight__main">
              <span className="ft-dash-stat__value">
                {nf.format(currentWeight)}
                <span className="ft-dash-stat__unit">{unit}</span>
              </span>
              <Delta tone={weightTone}>
                {signed(Math.round(weightChange * 10) / 10, nf)} {unit} · {t('dashboard.days30Short')}
              </Delta>
              {goal != null && (
                <span className="ft-dash-weight__goal">
                  {t('dashboard.goalLeft')
                    .replace('{goal}', `${nf.format(goal)} ${unit}`)
                    .replace('{left}', `${nf.format(Math.abs(Math.round((currentWeight - goal) * 10) / 10))} ${unit}`)}
                </span>
              )}
            </span>
            {weightData.length >= 2 && (
              <Sparkline
                className="ft-dash-weight__spark"
                values={weightData.map((p) => p.weight)}
                color={
                  weightTone === 'good'
                    ? 'var(--color-positive)'
                    : weightTone === 'bad'
                      ? 'var(--color-negative)'
                      : 'var(--color-accent-2)'
                }
              />
            )}
          </button>
        )}
      </section>
    </>
  )
}
