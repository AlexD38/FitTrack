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
  topExerciseProgress,
  muscleDistribution,
  weightSeries,
  weightDelta,
  getAllExerciseNames,
  exerciseProgressSeries,
} from '../lib/stats'

export function DashboardPage({ onOpenSettings }) {
  const { sessions, weightEntries, settings, setExerciseGoal } = useFitness()
  const { t } = useLocale()
  const exerciseNames = useMemo(() => getAllExerciseNames(sessions), [sessions])
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] ?? '')
  const [goalDraft, setGoalDraft] = useState('')

  useEffect(() => {
    if (exerciseNames.length && !exerciseNames.includes(selectedExercise)) {
      setSelectedExercise(exerciseNames[0])
    }
  }, [exerciseNames, selectedExercise])

  useEffect(() => {
    const g = settings.exerciseGoals?.[selectedExercise]
    setGoalDraft(g != null ? String(g) : '')
  }, [selectedExercise, settings.exerciseGoals])

  const monthCount = sessionsThisMonth(sessions)
  const weekVol = weekVolumeTotal(sessions)
  const progress = topExerciseProgress(sessions)
  const weightInfo = weightDelta(weightEntries)
  const unit = settings.weightUnit ?? 'kg'

  const volumeData = weeklyVolume(sessions)
  const muscleData = muscleDistribution(sessions)
  const exerciseData = exerciseProgressSeries(sessions, selectedExercise)
  const weightData = weightSeries(weightEntries, 90)
  const currentMax = exerciseData.length ? exerciseData[exerciseData.length - 1].weight : null
  const forceGoal = settings.exerciseGoals?.[selectedExercise]
  const forcePct =
    forceGoal && currentMax != null ? Math.min(100, Math.round((currentMax / forceGoal) * 100)) : null

  const goalEntries = Object.entries(settings.exerciseGoals ?? {})

  return (
    <>
      <PageHeader title={t('dashboard.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <div className="ft-kpi-grid">
        <KpiCard label={t('dashboard.sessionsMonth')} value={monthCount} />
        <KpiCard label={t('dashboard.weekVolume')} value={weekVol} sub="kg" />
        <KpiCard
          label={t('dashboard.topProgress')}
          value={progress ? `+${progress.delta} kg` : '—'}
          sub={progress?.name}
        />
        <KpiCard
          label={t('dashboard.currentWeight')}
          value={weightInfo.current ? `${weightInfo.current} ${unit}` : '—'}
          sub={
            settings.weightGoal
              ? `${t('weight.goal')}: ${settings.weightGoal} ${unit}`
              : weightInfo.sinceLast
                ? `${weightInfo.sinceLast > 0 ? '+' : ''}${weightInfo.sinceLast.toFixed(1)} ${unit}`
                : undefined
          }
        />
      </div>

      <ActivityHeatmap sessions={sessions} />

      {goalEntries.length > 0 && (
        <section className="ft-section ft-glass ft-glass--pad">
          <div className="ft-section__head">
            <h2 className="ft-section__title">{t('dashboard.forceGoals')}</h2>
          </div>
          {goalEntries.map(([name, target]) => {
            const series = exerciseProgressSeries(sessions, name)
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
          <h2 className="ft-section__title">{t('dashboard.exerciseProgress')}</h2>
          {exerciseNames.length > 0 && (
            <select
              className="ft-select"
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
            >
              {exerciseNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
        {selectedExercise && (
          <div className="ft-goal-row" style={{ marginBottom: 'var(--space-4)' }}>
            <input
              className="ft-input"
              type="number"
              inputMode="decimal"
              placeholder={t('goals.target')}
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
            />
            <button
              type="button"
              className="ft-btn ft-btn--secondary"
              onClick={() => setExerciseGoal(selectedExercise, goalDraft)}
            >
              {t('goals.set')}
            </button>
          </div>
        )}
        {forcePct != null && (
          <div className="ft-force-goal" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="ft-force-goal__head">
              <span>{t('goals.progress')}</span>
              <span>
                {forcePct >= 100
                  ? t('goals.reached')
                  : `${(forceGoal - currentMax).toFixed(1)} kg ${t('goals.toGoal')}`}
              </span>
            </div>
            <div className="ft-force-goal__bar">
              <div className="ft-force-goal__fill" style={{ width: `${forcePct}%` }} />
            </div>
          </div>
        )}
        {exerciseData.length >= 2 ? (
          <ExerciseProgressChart data={exerciseData} />
        ) : (
          <EmptyState message={t('dashboard.noProgress')} />
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
