import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { PageHeader } from '../components/PageHeader'
import { SettingsButton } from '../components/SettingsMenu'
import { EmptyState } from '../components/EmptyState'
import { Fab } from '../components/Fab'
import { BottomSheet } from '../components/BottomSheet'
import { WeightForm } from '../components/WeightForm'
import { WeightTrendChart } from '../components/charts/WeightTrendChart'
import { GlassCard } from '../components/GlassCard'
import { useFitness } from '../contexts/FitnessContext'
import { useLocale } from '../contexts/LocaleContext'
import { weightSeries, weightDelta } from '../lib/stats'

export function WeightPage({ onOpenSettings }) {
  const { weightEntries, addWeightEntry, deleteWeightEntry, settings, updateSettings } = useFitness()
  const { locale, t } = useLocale()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [range, setRange] = useState(90)
  const [goalDraft, setGoalDraft] = useState(settings.weightGoal ?? '')

  const unit = settings.weightUnit ?? 'kg'
  const chartData = useMemo(() => weightSeries(weightEntries, range), [weightEntries, range])
  const delta = weightDelta(weightEntries)
  const dateLocale = locale === 'fr' ? fr : enUS
  const goal = settings.weightGoal

  const handleSave = (entry) => {
    addWeightEntry(entry)
    setSheetOpen(false)
  }

  const deltaClass = (val) => {
    if (val === 0) return ''
    return val < 0 ? ' ft-positive' : ' ft-negative'
  }

  const saveGoal = () => {
    const n = Number(goalDraft)
    updateSettings({ weightGoal: n > 0 ? n : null })
  }

  return (
    <>
      <PageHeader title={t('weight.title')} actions={<SettingsButton onClick={onOpenSettings} />} />

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-section__head">
          <h2 className="ft-section__title">{t('goals.weightGoal')}</h2>
        </div>
        <div className="ft-goal-row">
          <input
            className="ft-input"
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder={`${t('goals.target')} (${unit})`}
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
          />
          <button type="button" className="ft-btn ft-btn--primary" onClick={saveGoal}>
            {t('goals.set')}
          </button>
        </div>
        {goal != null && delta.current != null && (
          <p className="ft-goal-meta">
            {t('weight.vsGoal')}:{' '}
            <strong className={delta.current <= goal ? 'ft-positive' : 'ft-negative'}>
              {(delta.current - goal).toFixed(1)} {unit}
            </strong>
          </p>
        )}
      </section>

      {weightEntries.length > 0 && (
        <div className="ft-weight-stats">
          <GlassCard className="ft-weight-stat">
            <p className={`ft-weight-stat__value${deltaClass(delta.sinceStart)}`}>
              {delta.sinceStart > 0 ? '+' : ''}
              {delta.sinceStart.toFixed(1)} {unit}
            </p>
            <p className="ft-weight-stat__label">{t('weight.sinceStart')}</p>
          </GlassCard>
          <GlassCard className="ft-weight-stat">
            <p className={`ft-weight-stat__value${deltaClass(delta.sinceLast)}`}>
              {delta.sinceLast > 0 ? '+' : ''}
              {delta.sinceLast.toFixed(1)} {unit}
            </p>
            <p className="ft-weight-stat__label">{t('weight.sinceLast')}</p>
          </GlassCard>
        </div>
      )}

      <section className="ft-section ft-glass ft-glass--pad">
        <div className="ft-section__head">
          <h2 className="ft-section__title">{t('weight.trend')}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className={`ft-chip${range === 30 ? ' ft-chip--active' : ''}`}
              onClick={() => setRange(30)}
            >
              {t('weight.days30')}
            </button>
            <button
              type="button"
              className={`ft-chip${range === 90 ? ' ft-chip--active' : ''}`}
              onClick={() => setRange(90)}
            >
              {t('weight.days90')}
            </button>
          </div>
        </div>
        {chartData.length >= 2 ? (
          <WeightTrendChart data={chartData} tall goal={goal} />
        ) : (
          <EmptyState message={t('weight.empty')} />
        )}
      </section>

      {weightEntries.length > 0 && (
        <section className="ft-section">
          {[...weightEntries]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((entry) => (
              <GlassCard key={entry.id} className="ft-session-card" style={{ marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="ft-session-card__date" style={{ fontSize: '0.9375rem' }}>
                      {format(parseISO(entry.date), 'd MMM yyyy', { locale: dateLocale })}
                    </p>
                    <p className="ft-kpi__value" style={{ fontSize: '1.25rem' }}>
                      {entry.weight} {unit}
                    </p>
                    {entry.note && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>{entry.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ft-btn ft-btn--ghost"
                    onClick={() => deleteWeightEntry(entry.id)}
                    aria-label={t('common.delete')}
                  >
                    ✕
                  </button>
                </div>
              </GlassCard>
            ))}
        </section>
      )}

      <Fab onClick={() => setSheetOpen(true)} label={t('weight.addEntry')} />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('weight.addEntry')}>
        <WeightForm onSave={handleSave} onCancel={() => setSheetOpen(false)} />
      </BottomSheet>
    </>
  )
}
