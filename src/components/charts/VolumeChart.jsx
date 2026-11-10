import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useLocale } from '../../contexts/LocaleContext'

/** Weekly volume bars; the last (current, still in progress) week is drawn faded. */
export function VolumeChart({ data }) {
  const { locale, t } = useLocale()
  const nf = new Intl.NumberFormat(locale === 'en' ? 'en' : 'fr')
  const lastIndex = data.length - 1

  return (
    <div className="ft-chart-wrap ft-chart-wrap--volume">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={2}
            tick={{ fill: 'var(--color-ink-faint, var(--color-ink-muted))', fontSize: 10 }}
          />
          <Tooltip
            cursor={{ fill: 'color-mix(in srgb, var(--color-ink) 6%, transparent)' }}
            contentStyle={{
              background: 'var(--color-surface-solid)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              color: 'var(--color-ink)',
              fontSize: '0.8125rem',
            }}
            formatter={(value, _name, item) => [
              `${nf.format(value)} kg · ${item.payload.count} ${t('dashboard.sessionsShort')}`,
              t('common.volume'),
            ]}
          />
          <Bar dataKey="volume" radius={[6, 6, 6, 6]} minPointSize={3}>
            {data.map((d, i) => (
              <Cell
                key={d.key}
                fill="var(--color-accent)"
                fillOpacity={i === lastIndex ? 0.4 : d.volume > 0 ? 1 : 0.15}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
