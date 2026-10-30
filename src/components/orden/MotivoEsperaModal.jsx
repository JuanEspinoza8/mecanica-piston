import { useState } from 'react';
import { PauseCircle } from 'lucide-react';

// Pide el repuesto que se está esperando al pasar la orden a "Esperando repuesto"
export default function MotivoEsperaModal({ onConfirmar, onClose }) {
  const [motivo, setMotivo] = useState('');

  const confirmar = () => onConfirmar(motivo.trim() || null);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
            <PauseCircle className="w-5 h-5 mr-2 text-orange-500" />
            Marcar en espera de repuesto
          </h3>
        </div>
        <div className="p-6">
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            ¿Qué repuesto se necesita? <span className="text-neutral-400 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
            placeholder="Ej: Pastillas de freno delanteras..."
            autoFocus
            className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            className="flex items-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-orange-500/20"
          >
            <PauseCircle className="w-4 h-4 mr-2" />
            Confirmar Espera
          </button>
        </div>
      </div>
    </div>
  );
}
