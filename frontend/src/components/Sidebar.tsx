import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  ArrowDownCircle,
  HeartPulse,
  LogOut,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { clsx } from 'clsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transacciones', label: 'Transacciones', icon: ArrowDownCircle },
  { to: '/tarjetas', label: 'Tarjetas', icon: CreditCard },
  { to: '/salud', label: 'Salud financiera', icon: HeartPulse },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-surface-300/60 bg-surface-50">
      <div className="flex items-center gap-2 px-5 py-5">
        <Wallet className="h-6 w-6 text-accent-500" />
        <span className="text-lg font-semibold text-gray-100">MiPlata</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-accent-500/10 text-accent-400'
                  : 'text-gray-400 hover:bg-surface-300/40 hover:text-gray-200',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-300/60 p-3">
        <div className="mb-2 px-2 text-xs text-gray-500">
          {user?.nombre ?? user?.email}
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-surface-300/40 hover:text-gray-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
