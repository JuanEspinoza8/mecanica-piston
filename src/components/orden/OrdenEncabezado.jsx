import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useUpdateOrden } from '../../hooks/useOrdenes';
import { ESTADOS_ORDEN, getEstadoBadge } from './estadoBadge';
import EditarOrdenModal from './EditarOrdenModal';
import MotivoEsperaModal from './MotivoEsperaModal';

// Cabecera de la orden: número, estado (con selector), editar y eliminar
export default function OrdenEncabezado({ orden, displayId, onEliminar }) {
  const { mutateAsync: updateOrden } = useUpdateOrden();
  const [editando, setEditando] = useState(false);
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);

  const cambiarEstado = async (estado, motivo_espera = null) => {
    try {
      await updateOrden({ id: orden.id, estado, motivo_espera });
      toast.success(estado === 'Esperando repuesto'
        ? 'Orden marcada en espera de repuesto'
        : `Estado cambiado a "${estado}"`);
      return true;
    } catch {
      toast.error("Error al cambiar estado");
      return false;
    }
  };

  const handleSeleccionarEstado = (estado) => {
    if (estado === orden.estado) return;
    // Para "Esperando repuesto" primero se pide qué repuesto falta
    if (estado === 'Esperando repuesto') setPidiendoMotivo(true);
    else cambiarEstado(estado);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <Link to="/ordenes" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{displayId}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getEstadoBadge(orden.estado)}`}>
              {orden.estado}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Ingreso: {orden.fecha_ingreso ? format(new Date(orden.fecha_ingreso), 'dd/MM/yyyy') : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Selector de estado — scrollable en mobile */}
        <div className="overflow-x-auto -mx-2 px-2 pb-1 sm:pb-0 sm:mx-0 sm:px-0">
          <div className="flex bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 gap-0.5 w-max">
            {ESTADOS_ORDEN.map((est) => (
              <button
                key={est}
                onClick={() => handleSeleccionarEstado(est)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-all whitespace-nowrap ${
                  orden.estado === est
                    ? getEstadoBadge(est) + ' shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={onEliminar}
            className="flex items-center justify-center text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2.5 rounded-full transition-colors shrink-0"
            title="Eliminar Orden"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setEditando(true)}
            className="flex-1 sm:flex-none flex items-center justify-center text-sm font-semibold text-white bg-black dark:bg-red-600 hover:bg-neutral-900 dark:hover:bg-red-700 px-6 py-2.5 rounded-full transition-colors shadow-lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            Editar Orden
          </button>
        </div>
      </div>

      {editando && <EditarOrdenModal orden={orden} onClose={() => setEditando(false)} />}

      {pidiendoMotivo && (
        <MotivoEsperaModal
          onClose={() => setPidiendoMotivo(false)}
          onConfirmar={async (motivo) => {
            if (await cambiarEstado('Esperando repuesto', motivo)) setPidiendoMotivo(false);
          }}
        />
      )}
    </div>
  );
}
