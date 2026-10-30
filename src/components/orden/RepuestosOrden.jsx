import { useState } from 'react';
import { PackageOpen, Plus, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import AddRepuestoModal from '../AddRepuestoModal';
import ConfirmModal from '../ConfirmModal';
import CrearDeudaModal from '../CrearDeudaModal';
import { useRepuestos, useDeleteRepuesto, useUpdateOrden } from '../../hooks/useOrdenes';

const formatearMiles = (valor) => (valor ? Number(valor).toLocaleString('es-AR') : '');

// Repuestos de la orden, mano de obra y total estimado (que se puede cargar como deuda)
export default function RepuestosOrden({ orden, clienteId, displayId }) {
  const { data: repuestos = [] } = useRepuestos(orden.id);
  const { mutateAsync: deleteRepuesto, isPending: isDeleting } = useDeleteRepuesto();
  const { mutateAsync: updateOrden } = useUpdateOrden();

  const [agregando, setAgregando] = useState(false);
  const [repuestoABorrar, setRepuestoABorrar] = useState(null);
  const [cargandoDeuda, setCargandoDeuda] = useState(false);
  // Texto del input mientras se edita; null = se muestra lo guardado en la orden
  const [manoDeObraEditando, setManoDeObraEditando] = useState(null);

  // Cálculos de Totales
  const totalRepuestos = repuestos.reduce((sum, item) => sum + (Number(item.costo) * Number(item.cantidad)), 0);
  const manoDeObraGuardada = Number(orden.mano_de_obra) || 0;
  const costoManoDeObra = manoDeObraEditando !== null
    ? Number(manoDeObraEditando.replace(/\./g, '')) || 0
    : manoDeObraGuardada;
  const totalEstimado = totalRepuestos + costoManoDeObra;

  // Se guarda al salir del campo (offline queda encolado como cualquier update)
  const handleGuardarManoDeObra = async () => {
    if (manoDeObraEditando === null) return;
    try {
      if (costoManoDeObra !== manoDeObraGuardada) {
        await updateOrden({ id: orden.id, mano_de_obra: costoManoDeObra });
      }
    } catch {
      toast.error('No se pudo guardar la mano de obra');
    } finally {
      setManoDeObraEditando(null);
    }
  };

  const handleDeleteRepuesto = async () => {
    try {
      await deleteRepuesto({ id: repuestoABorrar.id, ordenId: orden.id });
      toast.success("Repuesto eliminado");
      setRepuestoABorrar(null);
    } catch {
      toast.error("Error al eliminar repuesto");
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full relative">

      <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center justify-between">
          <div className="flex items-center">
            <PackageOpen className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" /> Repuestos
          </div>
          <span className="bg-black dark:bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{repuestos.length}</span>
        </h2>
      </div>

      <div className="flex-1 p-5 space-y-4 max-h-[400px] overflow-y-auto">
        {repuestos.length === 0 ? (
          <div className="text-center p-6 bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
            <PackageOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">No hay repuestos registrados en esta orden.</p>
          </div>
        ) : (
          repuestos.map(rep => (
            <div key={rep.id} className="group flex justify-between items-start bg-neutral-50 dark:bg-neutral-800/30 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors">
              <div className="flex-1 pr-3">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm leading-tight">{rep.nombre}</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    {rep.cantidad} x ${(Number(rep.costo) || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-bold text-neutral-900 dark:text-white text-sm">
                  ${(rep.cantidad * Number(rep.costo)).toLocaleString('es-AR')}
                </p>
                <button
                  onClick={() => setRepuestoABorrar(rep)}
                  className="text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                  title="Eliminar repuesto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botón fijo para añadir repuesto (fuera del área con scroll) */}
      <div className="px-5 pb-5 pt-1 border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => setAgregando(true)}
          className="w-full py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-1" /> Añadir Repuesto
        </button>
      </div>

      {/* Total y Mano de Obra */}
      <div className="p-5 bg-black dark:bg-neutral-950 text-white mt-auto rounded-b-2xl border-t border-neutral-800 space-y-4">

        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-400">Subtotal Repuestos</span>
          <span className="font-bold">${totalRepuestos.toLocaleString('es-AR')}</span>
        </div>

        <div className="flex justify-between items-center text-sm group">
          <span className="text-neutral-400">Mano de Obra</span>
          <div className="flex items-center">
            <span className="text-neutral-400 mr-1">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={manoDeObraEditando ?? formatearMiles(manoDeObraGuardada)}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setManoDeObraEditando(raw ? formatearMiles(parseInt(raw, 10)) : '');
              }}
              onFocus={(e) => {
                setManoDeObraEditando(formatearMiles(manoDeObraGuardada));
                e.target.select();
              }}
              onBlur={handleGuardarManoDeObra}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
              aria-label="Mano de obra"
              className="w-24 bg-neutral-900 dark:bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-right text-white font-bold focus:outline-none focus:border-red-500 transition-colors appearance-none"
            />
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
          <span className="font-black text-lg">Total Estimado</span>
          <span className="font-black text-2xl text-red-500 flex items-center">
            ${totalEstimado.toLocaleString('es-AR')}
          </span>
        </div>

        {/* Botón cargar como deuda */}
        {totalEstimado > 0 && (
          <button
            onClick={() => setCargandoDeuda(true)}
            className="w-full mt-3 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center border border-white/10"
          >
            <DollarSign className="w-4 h-4 mr-1.5" />
            Cargar como Deuda
          </button>
        )}
      </div>

      <AddRepuestoModal
        isOpen={agregando}
        onClose={() => setAgregando(false)}
        ordenId={orden.id}
      />

      <ConfirmModal
        isOpen={!!repuestoABorrar}
        onClose={() => setRepuestoABorrar(null)}
        onConfirm={handleDeleteRepuesto}
        isLoading={isDeleting}
        titulo="¿Eliminar este repuesto?"
        mensaje={`Se eliminará "${repuestoABorrar?.nombre}" de la orden.`}
        textoConfirmar="Sí, eliminar repuesto"
      />

      {/* Modal Crear Deuda desde Total Estimado */}
      <CrearDeudaModal
        isOpen={cargandoDeuda}
        onClose={() => setCargandoDeuda(false)}
        clienteId={clienteId}
        ordenId={orden.id}
        defaultConcepto={`Reparación ${displayId} — ${orden.vehiculo?.marca || ''} ${orden.vehiculo?.modelo || ''}`}
        defaultMonto={totalEstimado}
      />
    </div>
  );
}
