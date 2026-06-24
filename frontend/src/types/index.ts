export interface User {
  id: string
  email: string
  nombre?: string | null
  ingresoFijo?: number | null
  createdAt?: string
}

export interface AuthResponse {
  access_token: string
  user: { id: string; email: string }
}

export type Estado = 'ok' | 'alerta' | 'critico'

export interface Indicador {
  valor: number
  meta: string
  estado: Estado
}

export interface IndicadorRegla {
  necesidades: number
  gustos: number
  ahorro: number
  meta: string
  estado: Estado
}

export interface TarjetaResumen {
  id: string
  nombre: string
  saldoActual: number
  limite: number | null
  fechaCorte: number | null
  fechaLimite: number | null
}

export interface DashboardSalud {
  mes: string
  resumen: {
    ingresoMensual: number
    gastoMensual: number
    ahorroMes: number
    balance: number
  }
  indicadores: {
    ratioDeudaIngreso: Indicador
    fondoEmergencia: Indicador
    utilizacionCredito: Indicador
    regla503020: IndicadorRegla
    puntualidadPagos: Indicador
  }
  tarjetas: TarjetaResumen[]
}
