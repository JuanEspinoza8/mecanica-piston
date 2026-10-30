import { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateOrden } from '../../hooks/useOrdenes';

// Se monta al abrirse, así el formulario arranca siempre con los datos actuales
export default function EditarOrdenModal({ orden, onClose }) {
  const { mutateAsync: updateOrden, isPending } = useUpdateOrden();
  const [sintoma, setSintoma] = useState(orden.sintoma || '');
  const [notas, setNotas] = useState(orden.notas || '');

  const handleGuardar = async () => {
    try {
      await updateOrden({ id: orden.id, sintoma, notas });
      toast.success("Orden actualizada");
      onClose();
    } catch {
      toast.error("Error al actualizar orden");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">

        {/* Header del modal */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
            Editar Orden
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-6 space-y-5">

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Motivo de Ingreso / Síntoma
            </label>
            <textarea
              value={sintoma}
              onChange={(e) => setSintoma(e.target.value)}
              rows={3}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors resize-none text-sm"
              placeholder="Describe el problema del vehículo..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Notas Internas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors resize-none text-sm"
              placeholder="Notas visibles solo para el taller..."
            />
          </div>
        </div>

        {/* Footer del modal */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={isPending}
            className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-red-600/20"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
