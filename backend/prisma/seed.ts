import { PrismaClient, TipoCategoria } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const categorias = [
    { nombre: 'Vivienda/Renta', tipo: TipoCategoria.necesidad, icono: 'home' },
    { nombre: 'Servicios (luz/agua/internet)', tipo: TipoCategoria.necesidad, icono: 'zap' },
    { nombre: 'Supermercado', tipo: TipoCategoria.necesidad, icono: 'shopping-cart' },
    { nombre: 'Transporte', tipo: TipoCategoria.necesidad, icono: 'car' },
    { nombre: 'Salud', tipo: TipoCategoria.necesidad, icono: 'heart' },
    { nombre: 'Educación', tipo: TipoCategoria.necesidad, icono: 'book' },
    { nombre: 'Comidas fuera', tipo: TipoCategoria.gusto, icono: 'utensils' },
    { nombre: 'Entretenimiento', tipo: TipoCategoria.gusto, icono: 'film' },
    { nombre: 'Ropa', tipo: TipoCategoria.gusto, icono: 'shirt' },
    { nombre: 'Viajes', tipo: TipoCategoria.gusto, icono: 'plane' },
    { nombre: 'Suscripciones', tipo: TipoCategoria.gusto, icono: 'repeat' },
    { nombre: 'Ahorro', tipo: TipoCategoria.ahorro, icono: 'piggy-bank' },
    { nombre: 'Inversión', tipo: TipoCategoria.ahorro, icono: 'trending-up' },
    { nombre: 'Pago de deuda', tipo: TipoCategoria.ahorro, icono: 'credit-card' },
  ]

  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: c,
    })
  }

  const existing = await prisma.user.findFirst()
  if (!existing) {
    const hash = await bcrypt.hash('miplata123', 10)
    await prisma.user.create({
      data: {
        email: 'angel@miplata.local',
        password: hash,
        nombre: 'Angel',
        ingresoFijo: 9700,
      },
    })
    console.log('Usuario inicial creado: angel@miplata.local / miplata123')
  } else {
    console.log('Ya existe un usuario, seed de usuario omitido.')
  }

  console.log('Seed completado: categorias + usuario inicial')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
