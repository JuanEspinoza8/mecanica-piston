import { useState } from 'react';
import { Wrench, Plus, CheckCircle2, Circle, Loader, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../ConfirmModal';
import { useTareas, useAddTarea, useUpdateTarea, useDeleteTarea } from '../../hooks/useOrdenes';
import { getEstadoBadge } from './estadoBadge';

const CICLO_ESTADOS = ['Pendiente', 'En proceso', 'Terminado'];

// Checklist de tareas de la orden con barra de progreso
export default function TareasOrden({ ordenId }) {
  const { data: tareas = [] } = useTareas(ordenId);
  const { mutateAsync: addTarea } = useAddTarea();
  const { mutateAsync: updateTarea } = useUpdateTarea();
  const { mutateAsync: deleteTarea, isPending: isDeleting } = useDeleteTarea();

  const [agregando, setAgregando] = useState(false);
  const [texto, setTexto] = useState('');
  const [tareaABorrar, setTareaABorrar] = useState(null);

  const tareasTerminadas = tareas.filter(t => t.estado === 'Terminado').length;
  const progresoPorcentaje = tareas.length === 0 ? 0 : Math.round((tareasTerminadas / tareas.length) * 100);

  const cancelarAlta = () => {
    setAgregando(false);
    setTexto('');
  };

  const handleAddTarea = async () => {
    if (texto.trim() === '') return;
    try {
      await addTarea({ ordenId, descripcion: texto.trim() });
      cancelarAlta();
    } catch {
      toast.error("Error al agregar tarea");
    }
  };

  // Un clic avanza el estado: Pendiente → En proceso → Terminado → Pendiente
  const avanzarEstado = async (tarea) => {
    const siguienteEstado = CICLO_ESTADOS[(CICLO_ESTADOS.indexOf(tarea.estado) + 1) % CICLO_ESTADOS.length];
    try {
      await updateTarea({ id: tarea.id, estado: siguienteEstado, ordenId });
    } catch {
      toast.error("Error al actualizar tarea");
    }
  };

  const handleDeleteTarea = async () => {
    try {
      await deleteTarea({ id: tareaABorrar.id, ordenId });
      toast.success("Tarea eliminada");
      setTareaABorrar(null);
    } catch {
      toast.error("Error al eliminar la tarea");
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" /> Tareas a Realizar
          </h2>
          <button
            onClick={() => setAgregando(true)}
            className="text-sm font-semibold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Nueva Tarea
          </button>
        </div>

        {/* Barra de progreso */}
        {tareas.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-500 ease-out"
                style={{ width: `${progresoPorcentaje}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              {tareasTerminadas} de {tareas.length} ({progresoPorcentaje}%)
            </span>
          </div>
        )}
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {tareas.map(tarea => {
          const isDone = tarea.estado === 'Terminado';
          const isInProgress = tarea.estado === 'En proceso';
          return (
            <div
              key={tarea.id}
              onClick={() => avanzarEstado(tarea)}
              className={`p-4 flex items-center justify-between transition-colors cursor-pointer select-none
                ${isDone ? 'bg-green-50/50 dark:bg-green-950/10' : isInProgress ? 'bg-blue-50/30 dark:bg-blue-950/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
            >
              <div className="flex items-center gap-3 flex-1">
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 shrink-0" />
                ) : isInProgress ? (
                  <Loader className="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Circle className="w-6 h-6 text-neutral-300 dark:text-neutral-600 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className={`font-medium transition-all ${isDone ? 'line-through text-neutral-400 dark:text-neutral-600' : 'text-neutral-800 dark:text-neutral-200'}`}>
                    {tarea.descripcion}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Clic para avanzar estado
                  </span>
                </div>
              </div>
              <div className="flex items-center ml-4 shrink-0">
                <span className={`px-2 py-1 rounded text-xs font-bold border mr-2 ${getEstadoBadge(tarea.estado)}`}>
                  {tarea.estado}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setTareaABorrar(tarea); }}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Input inline para nueva tarea */}
        {agregando && (
          <div className="p-4 flex items-center gap-3 bg-red-50/30 dark:bg-red-950/10 border-t border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-top-2 duration-200">
            <Circle className="w-6 h-6 text-neutral-300 dark:text-neutral-600 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Ej: Cambio de aceite y filtro..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTarea(); if (e.key === 'Escape') cancelarAlta(); }}
              className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors text-sm"
            />
            <button
              onClick={handleAddTarea}
              disabled={!texto.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white text-sm font-bold rounded-lg transition-colors shrink-0"
            >
              Agregar
            </button>
            <button
              onClick={cancelarAlta}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {!agregando && tareas.length === 0 && (
          <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
            No hay tareas registradas. Agrega una para comenzar.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!tareaABorrar}
        onClose={() => setTareaABorrar(null)}
        onConfirm={handleDeleteTarea}
        isLoading={isDeleting}
        titulo="¿Eliminar esta tarea?"
        mensaje={`Se eliminará la tarea "${tareaABorrar?.descripcion}".`}
        textoConfirmar="Sí, eliminar tarea"
      />
    </div>
  );
}
