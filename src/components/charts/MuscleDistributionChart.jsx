import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getMuscleColor } from '../../lib/muscles'
import { muscleLabel } from '../../lib/i18n'
import { useLocale } from '../../contexts/LocaleContext'

export function MuscleDistributionChart({ data }) {
  const { locale } = useLocale()
  const chartData = data.map((d) => ({
    ...d,
    name: muscleLabel(locale, d.muscle),
    fill: getMuscleColor(d.muscle),
  }))

  return (
    <div className="ft-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
          >
            {chartData.map((entry) => (
              <Cell key={entry.muscle} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-ink)',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
