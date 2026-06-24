import { clsx } from 'clsx'
import type { Estado, Indicador } from '../../types'
import { Card } from './Card'

const estadoStyles: Record<Estado, { ring: string; badge: string; label: string }> = {
  ok: { ring: 'border-accent-500/30', badge: 'bg-accent-500/15 text-accent-400', label: 'Saludable' },
  alerta: {
    ring: 'border-warning-500/30',
    badge: 'bg-warning-500/15 text-warning-500',
    label: 'Atención',
  },
  critico: { ring: 'border-danger-500/30', badge: 'bg-danger-500/15 text-danger-500', label: 'Crítico' },
}

interface IndicadorCardProps {
  titulo: string
  indicador: Indicador
  formato?: (v: number) => string
  icon?: React.ReactNode
}

export function IndicadorCard({ titulo, indicador, formato, icon }: IndicadorCardProps) {
  const s = estadoStyles[indicador.estado]
  return (
    <Card className={clsx('border', s.ring)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-gray-400">
          {icon}
          <span className="text-sm">{titulo}</span>
        </div>
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', s.badge)}>
          {s.label}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-gray-100">
        {formato ? formato(indicador.valor) : indicador.valor}
      </div>
      <div className="mt-1 text-xs text-gray-500">Meta: {indicador.meta}</div>
    </Card>
  )
}
