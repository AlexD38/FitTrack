import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { KpiCard } from '../components/KpiCard'
import { EmptyState } from '../components/EmptyState'
import { VolumeChart } from '../components/charts/VolumeChart'
import { ExerciseProgressChart } from '../components/charts/ExerciseProgressChart'
import { MuscleDistributionChart } from '../components/charts/MuscleDistributionChart'
import { WeightTrendChart } from '../components/charts/WeightTrendChart'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import {
  sessionsThisMonth,
  weekVolumeTotal,
  weeklyVolume,
  muscleDistribution,
  weightSeries,
  getAllExerciseNames,
  exerciseProgressSeries,
} from '../lib/stats'
import { statsSessionsOnly } from '../lib/sessionStatus'

export function DashboardPage({ onOpenSettings }) {
  const { sessions, weightEntries, settings } = useFitness()
  const { t } = useLocale()
  const statsSessions = useMemo(() => statsSessionsOnly(sessions), [sessions])
  const exerciseNames = useMemo(() => getAllExerciseNames(statsSessions), [statsSessions])
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? '')

  useEffect(() => {
    if (!exerciseNames.length) {
      setSelectedExercise('')
      return
    }
    if (!exerciseNames.includes(selectedExercise)) {
      setSelectedExercise(exerciseNames[0])
    }
  }, [exerciseNames, selectedExercise])

  const monthCount = sessionsThisMonth(statsSessions)
  const weekVol = weekVolumeTotal(statsSessions)

  const volumeData = weeklyVolume(statsSessions)
  const muscleData = muscleDistribution(statsSessions)
  const exerciseData = useMemo(
    () => exerciseProgressSeries(statsSessions, selectedExercise),
    [statsSessions, selectedExercise],
  )
  const weightData = weightSeries(weightEntries, 90)

  const goalEntries = Object.entries(settings.exerciseGoals ?? {})

  return (
    <>
      <PageHeader title={t('dashboard.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <div className="ft-kpi-grid">
        <KpiCard label={t('dashboard.sessionsMonth')} value={monthCount} />
        <KpiCard label={t('dashboard.weekVolume')} value={weekVol} sub="kg" />
      </div>

      <ActivityHeatmap sessions={sessions} />

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-section__head">
          <h2 className="ft-section__title">{t('dashboard.exerciseProgress')}</h2>
        </div>
        {exerciseNames.length === 0 ? (
          <EmptyState message={t('dashboard.noExercises')} />
        ) : (
          <>
            <label className="ft-field__label" htmlFor="ft-dash-exercise">
              {t('dashboard.selectExercise')}
            </label>
            <select
              id="ft-dash-exercise"
              className="ft-select ft-select--block"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              {exerciseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {exerciseData.length > 0 ? (
              <ExerciseProgressChart data={exerciseData} />
            ) : (
              <EmptyState message={t('dashboard.noProgress')} />
            )}
          </>
        )}
      </section>

      {goalEntries.length > 0 && (
        <section className="ft-section ft-glass ft-glass--pad">
          <div className="ft-section__head">
            <h2 className="ft-section__title">{t('dashboard.forceGoals')}</h2>
          </div>
          {goalEntries.map(([name, target]) => {
            const series = exerciseProgressSeries(statsSessions, name)
            const max = series.length ? series[series.length - 1].weight : 0
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

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-section__head">
          <h2 className="ft-section__title">{t('dashboard.weeklyVolume')}</h2>
        </div>
        {volumeData.some((d) => d.volume > 0) ? (
          <VolumeChart data={volumeData} />
        ) : (
          <EmptyState message={t('dashboard.noVolume')} />
        )}
      </section>

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-section__head">
          <h2 className="ft-section__title">{t('dashboard.muscleSplit')}</h2>
        </div>
        {muscleData.length > 0 ? (
          <MuscleDistributionChart data={muscleData} />
        ) : (
          <EmptyState message={t('dashboard.noMuscles')} />
        )}
      </section>

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-section__head">
          <h2 className="ft-section__title">{t('dashboard.weightPreview')}</h2>
        </div>
        {weightData.length >= 2 ? (
          <WeightTrendChart data={weightData} goal={settings.weightGoal} />
        ) : (
          <EmptyState message={t('dashboard.noWeight')} />
        )}
      </section>
    </>
  )
}
