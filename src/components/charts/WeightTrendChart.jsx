import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { format, parseISO } from 'date-fns'

export function WeightTrendChart({ data, tall, goal }) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'd/MM'),
  }))

  const weights = formatted.map((d) => d.weight)
  const minW = Math.min(...weights, goal != null ? goal : Infinity)
  const maxW = Math.max(...weights, goal != null ? goal : -Infinity)

  return (
    <div className={`ft-chart-wrap${tall ? ' ft-chart-wrap--tall' : ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="ft-weight-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} />
          <YAxis
            domain={[minW - 1, maxW + 1]}
            tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-ink)',
            }}
          />
          {goal != null && Number(goal) > 0 && (
            <ReferenceLine
              y={Number(goal)}
              stroke="var(--color-accent-2)"
              strokeDasharray="4 4"
              label={{ value: 'Goal', fill: 'var(--color-accent-2)', fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="weight"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            fill="url(#ft-weight-grad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
