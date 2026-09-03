import { TECHNICAL_METRICS } from '@/data/landingData'
import MaterialIcon from '@/components/common/MaterialIcon'

export default function MetricsBar() {
  return (
    <section className="w-full border-y border-metal bg-surface-card">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 divide-y divide-metal md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
        {TECHNICAL_METRICS.map((metric) => (
          <div key={metric.id} className="flex flex-col gap-1 bg-surface-card-deep/50 p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wide text-muted">{metric.label}</span>
              <MaterialIcon name={metric.icon} className="text-[18px] text-accent-red" />
            </div>
            <div className="font-mono text-2xl font-bold tracking-tight text-main">{metric.value}</div>
            <div className="font-mono text-[11px] uppercase tracking-wide text-muted">{metric.detail}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
