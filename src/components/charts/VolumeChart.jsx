import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

export function VolumeChart({ data }) {
  return (
    <div className="ft-chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-ink)',
            }}
          />
          <Bar dataKey="volume" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
