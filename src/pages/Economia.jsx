import { DollarSign, TrendingUp, TrendingDown, Wallet, Loader2, AlertCircle, Users } from 'lucide-react';
import { useEconomia } from '../hooks/useEconomia';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart,
} from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6'];

const formatCurrency = (value) => `$${Number(value).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-bold text-neutral-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export default function Economia() {
  const { data, isLoading, isError } = useEconomia();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Calculando economía del taller...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl flex flex-col items-center">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p className="font-semibold">Error al cargar datos financieros</p>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Ingresos (12 meses)', value: formatCurrency(data.totalIngresos), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900/50' },
    { label: 'Costo Repuestos', value: formatCurrency(data.totalCostos), icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900/50' },
    { label: 'Ganancia Neta', value: formatCurrency(data.gananciaNeta), icon: Wallet, color: data.gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-600', bg: data.gananciaNeta >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20', border: data.gananciaNeta >= 0 ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-red-200 dark:border-red-900/50' },
    { label: 'Deuda Pendiente', value: formatCurrency(data.deudaTotal), icon: DollarSign, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Economía del Taller</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Estadísticas financieras de los últimos 12 meses</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`${card.bg} rounded-2xl border ${card.border} p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{card.label}</span>
              </div>
              <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Gráfico principal: Ingresos vs Costos vs Neto */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Ingresos vs Costos Mensual</h3>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data.meses}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#888" />
            <YAxis tick={{ fontSize: 12 }} stroke="#888" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="ingresos" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="costos" name="Repuestos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Line dataKey="neto" name="Neto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico: Deudas creadas a lo largo del tiempo */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Deudas Generadas por Mes</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.meses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#888" />
              <YAxis tick={{ fontSize: 11 }} stroke="#888" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area dataKey="deudas" name="Deudas" type="monotone" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Proyección de ingresos por cuotas */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Ingresos Proyectados</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">Basado en cuotas pendientes de cobro</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.proyeccion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#888" />
              <YAxis tick={{ fontSize: 11 }} stroke="#888" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="proyectado" name="Proyectado" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por método de pago */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Distribución por Método de Pago</h3>
          {data.distribucionMetodos.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.distribucionMetodos}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={75}
                      dataKey="value"
                      nameKey="name"
                      strokeWidth={2}
                      stroke="transparent"
                    >
                      {data.distribucionMetodos.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 w-full sm:flex-1">
                {data.distribucionMetodos.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.name}</span>
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-white">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-neutral-400 text-center py-10">Sin datos de pagos</p>
          )}
        </div>

        {/* Top clientes con deuda */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2 text-neutral-500" />
            Clientes con Mayor Deuda
          </h3>
          {data.topClientes.length > 0 ? (
            <div className="space-y-3">
              {data.topClientes.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-black text-neutral-600 dark:text-neutral-400">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-white text-sm">{c.nombre}</p>
                      <p className="text-xs text-neutral-500">{c.deudasCount} deuda{c.deudasCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="font-black text-red-600 dark:text-red-400 text-sm">{formatCurrency(c.deuda)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 text-center py-10">No hay deudas pendientes 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
