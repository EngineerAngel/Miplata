import { Card } from '../components/ui/Card'

export function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-100">{titulo}</h1>
      <Card>
        <p className="text-sm text-gray-500">Módulo en construcción. Próxima fase del roadmap.</p>
      </Card>
    </div>
  )
}
