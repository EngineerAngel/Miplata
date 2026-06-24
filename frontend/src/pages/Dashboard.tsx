import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ShieldCheck,
  PiggyBank,
  Scale,
  Clock,
} from 'lucide-react'
import { saludApi } from '../api/salud'
import type { DashboardSalud } from '../types'
import { Card } from '../components/ui/Card'
import { IndicadorCard } from '../components/ui/IndicadorCard'

const mxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

export function Dashboard() {
  const [data, setData] = useState<DashboardSalud | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    saludApi
      .dashboard()
      .then(setData)
      .catch(() => toast.error('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-gray-500">Cargando dashboard…</div>
  if (!data) return null

  const { resumen, indicadores, tarjetas } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen {data.mes}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Ingresos</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-accent-400">{mxn(resumen.ingresoMensual)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm">Gastos</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-danger-500">{mxn(resumen.gastoMensual)}</div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-400">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">Balance</span>
          </div>
          <div
            className={`mt-2 text-2xl font-semibold ${resumen.balance >= 0 ? 'text-accent-400' : 'text-danger-500'}`}
          >
            {mxn(resumen.balance)}
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-gray-400">
            <PiggyBank className="h-4 w-4" />
            <span className="text-sm">Ahorro</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-100">{mxn(resumen.ahorroMes)}</div>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-gray-200">Indicadores CONDUSEF</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <IndicadorCard
            titulo="Deuda / Ingreso"
            indicador={indicadores.ratioDeudaIngreso}
            formato={(v) => `${v}%`}
            icon={<Scale className="h-4 w-4" />}
          />
          <IndicadorCard
            titulo="Fondo de emergencia"
            indicador={indicadores.fondoEmergencia}
            formato={(v) => `${v} meses`}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <IndicadorCard
            titulo="Utilización de crédito"
            indicador={indicadores.utilizacionCredito}
            formato={(v) => `${v}%`}
            icon={<CreditCard className="h-4 w-4" />}
          />
          <IndicadorCard
            titulo="Puntualidad de pagos"
            indicador={indicadores.puntualidadPagos}
            formato={(v) => `${v}%`}
            icon={<Clock className="h-4 w-4" />}
          />
          <Card className="md:col-span-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Scale className="h-4 w-4" />
              <span className="text-sm">Regla 50/30/20</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-semibold text-gray-100">
                  {indicadores.regla503020.necesidades}%
                </div>
                <div className="text-xs text-gray-500">Necesidades (50)</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-100">
                  {indicadores.regla503020.gustos}%
                </div>
                <div className="text-xs text-gray-500">Gustos (30)</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-100">
                  {indicadores.regla503020.ahorro}%
                </div>
                <div className="text-xs text-gray-500">Ahorro (20)</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium text-gray-200">Tarjetas</h2>
        {tarjetas.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">
              No hay tarjetas registradas. Agrega una en el módulo de Tarjetas.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tarjetas.map((t) => (
              <Card key={t.id}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-100">{t.nombre}</span>
                  {t.limite && (
                    <span className="text-xs text-gray-500">
                      Uso {Math.round((t.saldoActual / t.limite) * 100)}%
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xl font-semibold text-gray-100">
                  {mxn(t.saldoActual)}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-gray-500">
                  <span>Corte: día {t.fechaCorte ?? '—'}</span>
                  <span>Límite: {t.fechaLimite ?? '—'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
