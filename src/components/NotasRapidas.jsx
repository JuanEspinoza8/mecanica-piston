import { useState } from 'react';
import { Plus, X, Check, Loader2 } from 'lucide-react';
import { useNotas, useCreateNota, useToggleNota, useDeleteNota } from '../hooks/useNotas';

export default function NotasRapidas() {
  const { data: notas = [], isLoading } = useNotas();
  const { mutate: createNota, isPending: isCreating } = useCreateNota();
  const { mutate: toggleNota } = useToggleNota();
  const { mutate: deleteNota } = useDeleteNota();

  const [inputValue, setInputValue] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isCreating) return;
    createNota(inputValue.trim(), {
      onSuccess: () => setInputValue(''),
    });
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Notas Rápidas</h2>
      
      {/* Input */}
      <form onSubmit={handleAdd} className="relative mb-4">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={200}
          placeholder="Escribí una nota y presioná Enter..."
          className="w-full pl-4 pr-12 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:text-white transition-all placeholder:text-neutral-400"
        />
        <button 
          type="submit"
          disabled={!inputValue.trim() || isCreating}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-neutral-200 disabled:hover:text-neutral-500 transition-colors"
        >
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {/* Lista */}
      <div className="space-y-2 overflow-y-auto max-h-60 pr-1 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : notas.length === 0 ? (
          <p className="text-center text-neutral-400 text-sm py-4">No hay notas pendientes.</p>
        ) : (
          notas.map((nota) => (
            <div 
              key={nota.id}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                nota.completada 
                  ? 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-100 dark:border-neutral-800/50 opacity-70' 
                  : 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-red-200 dark:hover:border-red-900/50'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={() => toggleNota({ id: nota.id, completada: nota.completada })}
                  className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    nota.completada 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-neutral-300 dark:border-neutral-600 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  {nota.completada && <Check className="w-3.5 h-3.5" />}
                </button>
                <span className={`text-sm truncate transition-all duration-300 ${
                  nota.completada 
                    ? 'line-through text-neutral-400 dark:text-neutral-500' 
                    : 'text-neutral-700 dark:text-neutral-200'
                }`}>
                  {nota.texto}
                </span>
              </div>
              <button 
                onClick={() => deleteNota(nota.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all shrink-0"
                title="Eliminar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
