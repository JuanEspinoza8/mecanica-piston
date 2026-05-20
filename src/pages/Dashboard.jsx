import { Link } from 'react-router-dom';
import { Users, CarFront, Wrench, AlertCircle, ChevronRight, Loader2, CheckCircle2, Clock, PauseCircle, DollarSign, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import NotasRapidas from '../components/NotasRapidas';
import { useDashboard } from '../hooks/useDashboard';
import { useActividadReciente } from '../hooks/useHistorial';

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboard();
  const { data: actividad = [], isLoading: isLoadingActividad } = useActividadReciente();

  const statCards = [
    { label: 'Órdenes Activas', value: stats?.ordenesActivas ?? '-', icon: Wrench, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Vehículos en Taller', value: stats?.vehiculosEnTaller ?? '-', icon: CarFront, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Clientes Registrados', value: stats?.totalClientes ?? '-', icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Deuda Total', value: stats ? `$${stats.deudaTotal.toLocaleString('es-AR')}` : '-', icon: DollarSign, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Ingreso del Mes', value: stats ? `$${stats.ingresoMesBruto.toLocaleString('es-AR')}` : '-', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'En Espera', value: stats?.ordenesEspera?.length ?? '-', icon: PauseCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado':
      case 'Entregado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'En proceso': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'Esperando repuesto': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Panel de Control</h1>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 flex items-center shadow-sm hover:border-red-500 dark:hover:border-red-500/50 transition-colors overflow-hidden">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mr-3 shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 truncate">{stat.label}</p>
                <p className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white truncate" title={String(stat.value)}>
                  {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente — Últimas órdenes + historial, clickeables */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Actividad Reciente</h2>
          
          {isLoadingStats ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : (stats?.ultimasOrdenes?.length === 0 && actividad.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              <AlertCircle className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">No hay actividad reciente registrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Últimas Órdenes */}
              {stats?.ultimasOrdenes?.map(orden => (
                <Link
                  key={orden.id}
                  to={`/ordenes/${orden.id}`}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 shrink-0">
                      <Wrench className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-red-500 transition-colors truncate">
                        {orden.vehiculos?.marca} {orden.vehiculos?.modelo} — <span className="font-mono text-xs">{orden.vehiculos?.patente}</span>
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {orden.vehiculos?.clientes?.nombre} {orden.vehiculos?.clientes?.apellido || ''} · {orden.descripcion?.substring(0, 50)}{orden.descripcion?.length > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getEstadoBadge(orden.estado)}`}>
                      {orden.estado}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}

              {/* Historial de modificaciones recientes */}
              {actividad.slice(0, 5).map(item => (
                <Link
                  key={item.id}
                  to={item.vehiculo ? `/vehiculos/${item.vehiculo.id}` : '#'}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-2 shrink-0">
                      <Clock className="w-4 h-4 text-neutral-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                        {item.titulo}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {item.vehiculo ? `${item.vehiculo.patente} · ` : ''}{item.descripcion?.substring(0, 60)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 whitespace-nowrap ml-2 shrink-0">
                    {formatDistanceToNow(new Date(item.fecha), { addSuffix: true, locale: es })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Columna Lateral (Alertas + Notas) */}
        <div className="space-y-6 flex flex-col h-full">
          {/* Alertas Dinámicas */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Alertas del Taller</h2>
            {isLoadingStats ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : stats?.ordenesEspera?.length === 0 ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 p-4 rounded-xl flex items-start">
                <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg mr-3 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-bold text-green-800 dark:text-green-400 text-sm">Todo en orden</p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">No hay órdenes detenidas por falta de repuestos.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.ordenesEspera.map(orden => (
                  <Link
                    key={orden.id}
                    to={`/ordenes/${orden.id}`}
                    className="block bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl hover:border-red-300 dark:hover:border-red-700 transition-colors group"
                  >
                    <div className="flex items-start">
                      <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg mr-3 mt-0.5 shrink-0">
                        <PauseCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-red-800 dark:text-red-400 text-sm group-hover:text-red-600 transition-colors">
                          Esperando Repuesto
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1 truncate">
                          {orden.vehiculos?.marca} {orden.vehiculos?.modelo} ({orden.vehiculos?.patente})
                          {orden.motivo_espera ? ` — ${orden.motivo_espera}` : ''}
                        </p>
                        <p className="text-xs text-red-500/60 mt-0.5 truncate">
                          {orden.vehiculos?.clientes?.nombre} {orden.vehiculos?.clientes?.apellido || ''}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notas Rápidas */}
          <NotasRapidas />
        </div>
      </div>
    </div>
  );
}
