import { Activity, Users, CarFront, Wrench, AlertCircle } from 'lucide-react';
import NotasRapidas from '../components/NotasRapidas';

export default function Dashboard() {
  const stats = [
    { label: 'Órdenes Activas', value: '12', icon: Wrench, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Vehículos en Taller', value: '8', icon: CarFront, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Clientes Registrados', value: '156', icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Ingresos del Día', value: '$45.000', icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Panel de Control</h1>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex items-center shadow-sm hover:border-red-500 dark:hover:border-red-500/50 transition-colors">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} mr-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                <p className="text-2xl font-black text-neutral-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Actividad Reciente</h2>
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">No hay actividad reciente registrada hoy.</p>
          </div>
        </div>

        {/* Columna Lateral (Alertas + Notas) */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Alertas */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Alertas del Taller</h2>
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-start">
                <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg mr-3 mt-0.5">
                  <Wrench className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-red-800 dark:text-red-400 text-sm">Falta de Repuestos</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">Orden #102 detenida por falta de pastillas de freno.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notas Rápidas */}
          <NotasRapidas />
        </div>
      </div>
    </div>
  );
}
