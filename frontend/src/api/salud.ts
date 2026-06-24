import { api } from './client'
import type { DashboardSalud } from '../types'

export const saludApi = {
  dashboard: () => api.get<DashboardSalud>('/salud').then((r) => r.data),
}
