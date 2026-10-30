import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import useAppStore from '../store/useAppStore';
import { getSyncErrors, retrySyncError, discardSyncError } from '../db/offlineService';
import ConfirmModal from './ConfirmModal';

const TABLAS = {
  clientes: 'Cliente',
  vehiculos: 'Vehículo',
  ordenes_trabajo: 'Orden',
  repuestos: 'Repuesto',
  tareas_orden: 'Tarea',
  deudas: 'Deuda',
  pagos: 'Pago',
  notas: 'Nota',
  archivos: 'Archivo',
};

const OPERACIONES = {
  insert: 'Alta',
  update: 'Modificación',
  delete: 'Baja',
  upload: 'Subida de archivo',
};

// Algo reconocible del registro para que el usuario sepa de qué se trata
function resumen({ datos = {} }) {
  const nombre = [datos.nombre, datos.apellido].filter(Boolean).join(' ');
  if (datos.monto) return `$${Number(datos.monto).toLocaleString('es-AR')}`;
  return datos.patente || nombre || datos.descripcion || datos.concepto || datos.texto || datos.path || '';
}

/**
 * Botón con el contador de operaciones que no se pudieron sincronizar. Abre la
 * bandeja, donde cada operación se puede reintentar o descartar.
 */
export default function SyncErrorsPanel() {
  const syncErrorCount = useAppStore((s) => s.syncErrorCount);
  const [isOpen, setIsOpen] = useState(false);

  if (syncErrorCount === 0 && !isOpen) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-colors mr-2"
        title="Errores de sincronización"
      >
        <AlertTriangle className="w-4 h-4" />
        {syncErrorCount}
      </button>
      {isOpen && <SyncErrorsModal onClose={() => setIsOpen(false)} />}
    </>
  );
}

function SyncErrorsModal({ onClose }) {
  const queryClient = useQueryClient();
  const syncErrorCount = useAppStore((s) => s.syncErrorCount);
  const [descartar, setDescartar] = useState(null);

  // La clave incluye el contador para releer la bandeja cuando cambia
  const { data: errores = [] } = useQuery({
    queryKey: ['sync-errors', syncErrorCount],
    queryFn: getSyncErrors,
  });

  const handleRetry = async (op) => {
    await retrySyncError(op.id);
    toast.info('Reintentando...');
  };

  const handleDiscard = async () => {
    await discardSyncError(descartar.id);
    setDescartar(null);
    // Volver a leer del servidor: la reconciliación del caché deshace el
    // cambio local que no se pudo sincronizar.
    queryClient.invalidateQueries();
    toast.success('Cambio descartado');
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Errores de sincronización
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-5 pt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Estos cambios se hicieron sin conexión y el servidor los rechazó. Podés reintentarlos
          (por ejemplo, después de corregir el dato en conflicto) o descartarlos.
        </p>

        <div className="p-5 space-y-3 overflow-y-auto">
          {errores.length === 0 && (
            <p className="text-center text-sm text-neutral-500 py-6">No hay errores pendientes.</p>
          )}
          {errores.map(op => (
            <div key={op.id} className="p-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-neutral-900 dark:text-white">
                    {OPERACIONES[op.operacion] || op.operacion} de {(TABLAS[op.tabla] || op.tabla).toLowerCase()}
                    {resumen(op) && <span className="font-medium text-neutral-500"> · {resumen(op)}</span>}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{format(new Date(op.timestamp), 'dd/MM/yyyy HH:mm')}</p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-2 break-words">{op.ultimoError}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleRetry(op)}
                    className="flex items-center text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reintentar
                  </button>
                  <button
                    onClick={() => setDescartar(op)}
                    className="flex items-center text-xs font-bold text-red-600 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-900/50 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Descartar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!descartar}
        onClose={() => setDescartar(null)}
        onConfirm={handleDiscard}
        titulo="¿Descartar este cambio?"
        mensaje="El cambio hecho sin conexión se pierde y la pantalla vuelve a mostrar lo que tiene el servidor."
        textoConfirmar="Sí, descartar"
      />
    </div>
  );
}
