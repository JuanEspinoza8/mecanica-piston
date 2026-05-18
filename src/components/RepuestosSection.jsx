import { useState } from 'react';
import { PackageOpen, DollarSign, Hash, Plus, Trash2, Loader2 } from 'lucide-react';
import { useRepuestos, useAddRepuesto, useDeleteRepuesto } from '../hooks/useOrdenes';
import { toast } from 'sonner';

export default function RepuestosSection({ ordenId }) {
  const { data: repuestos = [], isLoading } = useRepuestos(ordenId);
  const { mutateAsync: addRepuesto, isPending: isAdding } = useAddRepuesto();
  const { mutateAsync: deleteRepuesto, isPending: isDeleting } = useDeleteRepuesto();

  const [nombre, setNombre] = useState('');
  const [costo, setCosto] = useState('');
  const [cantidad, setCantidad] = useState('1');

  const subtotal = repuestos.reduce((sum, r) => sum + (Number(r.costo) * Number(r.cantidad)), 0);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return toast.error('El nombre del repuesto es obligatorio');
    const costoNum = parseFloat(costo);
    if (isNaN(costoNum) || costoNum <= 0) return toast.error('El costo debe ser mayor a 0');
    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum < 1) return toast.error('La cantidad mínima es 1');

    try {
      await addRepuesto({ ordenId, nombre: nombre.trim(), costo: costoNum, cantidad: cantidadNum });
      toast.success('Repuesto agregado');
      setNombre(''); setCosto(''); setCantidad('1');
    } catch {
      toast.error('Error al agregar repuesto');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRepuesto(id);
      toast.success('Repuesto eliminado');
    } catch {
      toast.error('Error al eliminar repuesto');
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
          <PackageOpen className="w-5 h-5 mr-2 text-neutral-500" />
          Repuestos y Materiales
        </h3>
        <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2 py-1 rounded-full">
          ${subtotal.toLocaleString('es-AR')}
        </span>
      </div>

      {/* Mini-form inline */}
      <form onSubmit={handleAdd} className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">Nombre *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PackageOpen className="h-4 w-4 text-neutral-400" />
              </div>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Pastillas de freno" className="block w-full pl-9 pr-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-900 dark:text-white text-sm transition-colors" />
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">Costo ($) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-neutral-400" />
              </div>
              <input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="0" min="0" step="0.01" className="block w-full pl-9 pr-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-900 dark:text-white text-sm transition-colors" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wider">Cant.</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-neutral-400" />
              </div>
              <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min="1" className="block w-full pl-9 pr-3 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-neutral-900 dark:text-white text-sm transition-colors" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={isAdding} className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-sm">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Agregar</>}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de repuestos */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
        ) : repuestos.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">No hay repuestos cargados aún.</div>
        ) : (
          repuestos.map(rep => (
            <div key={rep.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900 dark:text-white truncate">{rep.nombre}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  ${Number(rep.costo).toLocaleString('es-AR')} × {rep.cantidad} = <span className="font-bold text-neutral-700 dark:text-neutral-200">${(Number(rep.costo) * Number(rep.cantidad)).toLocaleString('es-AR')}</span>
                </p>
              </div>
              <button onClick={() => handleDelete(rep.id)} disabled={isDeleting} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0 ml-3" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Subtotal footer */}
      {repuestos.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center">
          <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Subtotal Repuestos</span>
          <span className="text-lg font-black text-neutral-900 dark:text-white">${subtotal.toLocaleString('es-AR')}</span>
        </div>
      )}
    </div>
  );
}
