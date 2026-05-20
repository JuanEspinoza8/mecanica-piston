import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, titulo, mensaje, textoConfirmar = "Eliminar", isLoading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo oscuro (Backdrop) */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Tarjeta del Modal */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-red-600/30 rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all">
        
        {/* Cabecera roja de advertencia */}
        <div className="bg-red-50 dark:bg-red-950/30 px-6 py-4 border-b border-red-100 dark:border-red-900/50 flex items-center justify-between">
          <div className="flex items-center text-red-600 dark:text-red-500 font-bold">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Atención Requerida
          </div>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            {titulo}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {mensaje}
          </p>
        </div>

        {/* Acciones */}
        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-950/50 border-t border-neutral-100 dark:border-neutral-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center"
          >
            {isLoading ? 'Procesando...' : textoConfirmar}
          </button>
        </div>

      </div>
    </div>
  );
}
