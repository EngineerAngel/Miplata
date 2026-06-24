import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Wallet } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const { login, token, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('angel@miplata.local')
  const [password, setPassword] = useState('miplata123')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (token) return <Navigate to="/" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      toast.success('Sesión iniciada')
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al iniciar sesión'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10">
            <Wallet className="h-6 w-6 text-accent-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-100">MiPlata</h1>
          <p className="mt-1 text-sm text-gray-500">Finanzas personales</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          <Input
            id="email"
            type="email"
            label="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-600">
          Demo: angel@miplata.local / miplata123
        </p>
      </div>
    </div>
  )
}
