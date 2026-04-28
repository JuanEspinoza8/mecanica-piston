import { Users, ClipboardList, Wallet, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  // Datos simulados (mock data) por ahora
  const stats = [
    { title: 'Total Clientes', value: '124', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Órdenes Abiertas', value: '8', icon: ClipboardList, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Cobros Pendientes', value: '$45.200', icon: Wallet, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const ultimasOrdenes = [
    { id: 'ORD-001', vehiculo: 'Ford Fiesta (AB123CD)', estado: 'En proceso', fecha: 'Hoy' },
    { id: 'ORD-002', vehiculo: 'Toyota Hilux (AA000BB)', estado: 'Terminado', fecha: 'Ayer' },
    { id: 'ORD-003', vehiculo: 'VW Gol Trend (AC999XX)', estado: 'Esperando repuesto', fecha: 'Hace 2 días' },
  ];

  return (
    <div className="space-y-6 pb-6">
      
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Hola, Lucas 👋</h1>
        <p className="text-neutral-500">Aquí tienes el resumen de tu taller mecánico.</p>
      </div>

      {/* Grid de Métricas (1 columna en celular, 3 en computadora) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex items-center hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} mr-4 shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-neutral-500 truncate">{stat.title}</p>
                <p className="text-2xl font-black text-neutral-900 truncate">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Últimas Órdenes */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">Últimas Órdenes de Trabajo</h2>
          <Link to="/ordenes" className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center shrink-0 ml-4">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="divide-y divide-neutral-100">
          {ultimasOrdenes.map((orden, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-neutral-50 transition-colors gap-3">
              <div className="flex items-center overflow-hidden">
                <div className="bg-neutral-100 p-3 rounded-lg mr-4 shrink-0">
                  <Clock className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-neutral-900 truncate">{orden.vehiculo}</p>
                  <p className="text-xs text-neutral-500 truncate">{orden.id} • {orden.fecha}</p>
                </div>
              </div>
              
              <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                orden.estado === 'Terminado' ? 'bg-green-100 text-green-700' :
                orden.estado === 'En proceso' ? 'bg-blue-100 text-blue-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {orden.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
