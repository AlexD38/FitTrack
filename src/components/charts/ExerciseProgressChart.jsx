import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { useLocale } from '../../contexts/LocaleContext'

export function ExerciseProgressChart({ data }) {
  const { t } = useLocale()
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'd/MM'),
  }))

  return (
    <div className="ft-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} />
          <YAxis
            tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
            unit=" kg"
            width={48}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-ink)',
            }}
            formatter={(value, name) => {
              if (name === 'weight') return [`${value} kg`, t('dashboard.liftedWeight')]
              if (name === 'volume') return [`${value} kg`, t('common.volume')]
              return [value, name]
            }}
            labelFormatter={(_, payload) => {
              const date = payload?.[0]?.payload?.date
              return date ? format(parseISO(date), 'dd/MM/yyyy') : ''
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--color-accent-2)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--color-accent-2)', r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
