import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { TipoCategoria } from '@prisma/client'

type Estado = 'ok' | 'alerta' | 'critico'

interface Indicador {
  valor: number
  meta: string
  estado: Estado
}

interface IndicadorRegla {
  necesidades: number
  gustos: number
  ahorro: number
  meta: string
  estado: Estado
}

@Injectable()
export class SaludService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string) {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)

    const [user, txsMes, tarjetas, ahorroAcumulado] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.transaccion.findMany({
        where: { userId, fecha: { gte: inicioMes, lt: finMes } },
        include: { categoria: true },
      }),
      this.prisma.tarjeta.findMany({ where: { userId, activa: true } }),
      this.prisma.transaccion.aggregate({
        where: { userId, tipo: 'ingreso', categoria: { tipo: TipoCategoria.ahorro } },
        _sum: { monto: true },
      }),
    ])

    const ingresoFijo = Number(user?.ingresoFijo ?? 0)
    const ingresoVariableMes = txsMes
      .filter((t) => t.tipo === 'ingreso')
      .reduce((acc, t) => acc + Number(t.monto), 0)
    const ingresoMensual = ingresoFijo + ingresoVariableMes

    const gastosMes = txsMes.filter((t) => t.tipo === 'gasto')
    const gastoMensual = gastosMes.reduce((acc, t) => acc + Number(t.monto), 0)

    const porTipo = (tipo: TipoCategoria) =>
      gastosMes
        .filter((t) => t.categoria?.tipo === tipo)
        .reduce((acc, t) => acc + Number(t.monto), 0)

    const necesidades = porTipo(TipoCategoria.necesidad)
    const gustos = porTipo(TipoCategoria.gusto)
    const ahorroMes = porTipo(TipoCategoria.ahorro)

    const deudaMes = gastosMes
      .filter((t) => t.categoria?.nombre === 'Pago de deuda')
      .reduce((acc, t) => acc + Number(t.monto), 0)

    const saldoUsado = tarjetas.reduce((acc, t) => acc + Number(t.saldoActual), 0)
    const limiteTotal = tarjetas.reduce((acc, t) => acc + Number(t.limite ?? 0), 0)

    const ahorroTotal = Number(ahorroAcumulado._sum.monto ?? 0)

    return {
      mes: ahora.toISOString().slice(0, 7),
      resumen: {
        ingresoMensual,
        gastoMensual,
        ahorroMes,
        balance: ingresoMensual - gastoMensual,
      },
      indicadores: {
        ratioDeudaIngreso: this.ratioDeudaIngreso(deudaMes, ingresoMensual),
        fondoEmergencia: this.fondoEmergencia(ahorroTotal, gastoMensual),
        utilizacionCredito: this.utilizacionCredito(saldoUsado, limiteTotal),
        regla503020: this.regla503020(ingresoMensual, necesidades, gustos, ahorroMes),
        puntualidadPagos: { valor: 100, meta: '100%', estado: 'ok' },
      },
      tarjetas: tarjetas.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        saldoActual: Number(t.saldoActual),
        limite: t.limite ? Number(t.limite) : null,
        fechaCorte: t.fechaCorte,
        fechaLimite: t.fechaLimite,
      })),
    }
  }

  private ratioDeudaIngreso(deuda: number, ingreso: number): Indicador {
    if (ingreso === 0) return { valor: 0, meta: '≤ 35%', estado: 'ok' }
    const valor = (deuda / ingreso) * 100
    return {
      valor: Math.round(valor * 100) / 100,
      meta: '≤ 35%',
      estado: valor > 35 ? 'critico' : 'ok',
    }
  }

  private fondoEmergencia(ahorro: number, gastoMensual: number): Indicador {
    if (gastoMensual === 0) return { valor: 0, meta: '≥ 3 meses', estado: 'ok' }
    const meses = ahorro / gastoMensual
    return {
      valor: Math.round(meses * 10) / 10,
      meta: '≥ 3 meses',
      estado: meses < 3 ? 'alerta' : 'ok',
    }
  }

  private utilizacionCredito(saldoUsado: number, limiteTotal: number): Indicador {
    if (limiteTotal === 0) return { valor: 0, meta: '< 30%', estado: 'ok' }
    const valor = (saldoUsado / limiteTotal) * 100
    return {
      valor: Math.round(valor * 100) / 100,
      meta: '< 30%',
      estado: valor > 70 ? 'critico' : valor > 30 ? 'alerta' : 'ok',
    }
  }

  private regla503020(
    ingreso: number,
    necesidades: number,
    gustos: number,
    ahorro: number,
  ): IndicadorRegla {
    if (ingreso === 0) {
      return { necesidades: 0, gustos: 0, ahorro: 0, meta: '50/30/20', estado: 'ok' }
    }
    const pct = (n: number) => Math.round((n / ingreso) * 1000) / 10
    const n = pct(necesidades)
    const g = pct(gustos)
    const a = pct(ahorro)
    const desbalance = Math.abs(n - 50) > 10 || Math.abs(g - 30) > 10 || Math.abs(a - 20) > 10
    return { necesidades: n, gustos: g, ahorro: a, meta: '50/30/20', estado: desbalance ? 'alerta' : 'ok' }
  }
}
