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

export function ExerciseProgressChart({ data }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'd/MM'),
  }))

  return (
    <div className="ft-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-ink)',
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--color-accent-2)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--color-accent-2)', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
