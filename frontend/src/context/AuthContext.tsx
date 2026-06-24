import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    nombre?: string
    ingresoFijo?: number
  }) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('miplata_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('miplata_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('miplata_token', res.access_token)
    setToken(res.access_token)
    const me = await authApi.me()
    setUser(me)
  }, [])

  const register = useCallback(
    async (data: { email: string; password: string; nombre?: string; ingresoFijo?: number }) => {
      const res = await authApi.register(data)
      localStorage.setItem('miplata_token', res.access_token)
      setToken(res.access_token)
      const me = await authApi.me()
      setUser(me)
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('miplata_token')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
