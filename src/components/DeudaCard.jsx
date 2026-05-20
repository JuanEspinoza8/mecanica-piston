import { DollarSign, Trash2, CreditCard, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

const estadoConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/50', icon: Clock },
  parcial: { label: 'Pago parcial', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50', icon: AlertCircle },
  pagada: { label: 'Pagada', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50', icon: CheckCircle2 },
};

export default function DeudaCard({ deuda, onPagar, onEliminar, showOrden = false }) {
  const saldoPendiente = Number(deuda.monto_total) - Number(deuda.monto_pagado);
  const porcentajePagado = (Number(deuda.monto_pagado) / Number(deuda.monto_total)) * 100;
  const config = estadoConfig[deuda.estado] || estadoConfig.pendiente;
  const EstadoIcon = config.icon;

  const cuotaActual = deuda.en_cuotas
    ? Math.floor(Number(deuda.monto_pagado) / (Number(deuda.monto_total) / deuda.cantidad_cuotas))
    : null;

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border ${deuda.estado === 'pagada' ? 'border-green-200 dark:border-green-900/50 opacity-70' : 'border-neutral-200 dark:border-neutral-800'} p-5 shadow-sm transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-neutral-900 dark:text-white text-sm truncate">{deuda.concepto}</h4>
          {showOrden && deuda.ordenes_trabajo && (
            <p className="text-xs text-neutral-400 mt-0.5 truncate">
              {deuda.ordenes_trabajo.vehiculos?.patente} · {deuda.ordenes_trabajo.vehiculos?.marca} {deuda.ordenes_trabajo.vehiculos?.modelo}
            </p>
          )}
          <p className="text-xs text-neutral-400 mt-0.5">
            <Calendar className="w-3 h-3 inline mr-1" />
            {format(new Date(deuda.created_at), 'dd/MM/yyyy')}
          </p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.color} flex items-center gap-1 shrink-0`}>
          <EstadoIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      {/* Montos */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase">Total</p>
          <p className="text-sm font-black text-neutral-900 dark:text-white">${Number(deuda.monto_total).toLocaleString('es-AR')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase">Pagado</p>
          <p className="text-sm font-black text-green-600 dark:text-green-400">${Number(deuda.monto_pagado).toLocaleString('es-AR')}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-400 uppercase">Pendiente</p>
          <p className="text-sm font-black text-red-600 dark:text-red-400">${saldoPendiente.toLocaleString('es-AR')}</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${deuda.estado === 'pagada' ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
        />
      </div>

      {/* Info cuotas */}
      {deuda.en_cuotas && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
          <CreditCard className="w-3 h-3 inline mr-1" />
          Cuota {cuotaActual} de {deuda.cantidad_cuotas} — ${(Number(deuda.monto_total) / deuda.cantidad_cuotas).toLocaleString('es-AR')} c/u
        </p>
      )}

      {/* Botones */}
      {deuda.estado !== 'pagada' && (
        <div className="flex gap-2 mt-3">
          {onPagar && (
            <button
              onClick={() => onPagar(deuda)}
              className="flex-1 flex items-center justify-center py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Pagar
            </button>
          )}
          {onEliminar && (
            <button
              onClick={() => onEliminar(deuda)}
              className="p-2.5 border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              title="Eliminar deuda"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {deuda.estado === 'pagada' && onEliminar && (
        <div className="flex justify-end mt-2">
          <button
            onClick={() => onEliminar(deuda)}
            className="p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg"
            title="Eliminar registro"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
