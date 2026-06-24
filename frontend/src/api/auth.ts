import { api } from './client'
import type { AuthResponse, User } from '../types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (data: { email: string; password: string; nombre?: string; ingresoFijo?: number }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
