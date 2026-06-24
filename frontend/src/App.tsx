import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Placeholder } from './pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/transacciones" element={<Placeholder titulo="Transacciones" />} />
        <Route path="/tarjetas" element={<Placeholder titulo="Tarjetas" />} />
        <Route path="/salud" element={<Placeholder titulo="Salud financiera" />} />
      </Route>
    </Routes>
  )
}
