import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import DeudaCard from '../DeudaCard';
import PagoForm from '../PagoForm';
import ConfirmModal from '../ConfirmModal';
import { useDeudasOrden, useDeleteDeuda } from '../../hooks/useDeudas';

// Deudas cargadas desde esta orden, con registro de pagos
export default function DeudasOrden({ ordenId, clienteId }) {
  const { data: deudas = [] } = useDeudasOrden(ordenId);
  const { mutateAsync: deleteDeuda, isPending: isDeleting } = useDeleteDeuda();

  // undefined = formulario cerrado; null = pago sin deuda preseleccionada
  const [pagoDeudaId, setPagoDeudaId] = useState(undefined);
  const [deudaABorrar, setDeudaABorrar] = useState(null);

  const handleDeleteDeuda = async () => {
    try {
      await deleteDeuda({ id: deudaABorrar.id, cliente_id: deudaABorrar.cliente_id });
      setDeudaABorrar(null);
    } catch {
      // El hook ya muestra el error
    }
  };

  if (deudas.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-neutral-500" />
          Deuda de esta Orden
        </h3>
        <button
          onClick={() => setPagoDeudaId(null)}
          className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-lg"
        >
          <DollarSign className="w-3.5 h-3.5 mr-1" /> Registrar Pago
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deudas.map(deuda => (
          <DeudaCard
            key={deuda.id}
            deuda={deuda}
            onPagar={(d) => setPagoDeudaId(d.id)}
            onEliminar={(d) => setDeudaABorrar(d)}
          />
        ))}
      </div>

      {/* Modal Registrar Pago */}
      {pagoDeudaId !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <PagoForm
            clienteId={clienteId}
            ordenId={ordenId}
            preselectedDeudaId={pagoDeudaId}
            onSuccess={() => setPagoDeudaId(undefined)}
            onCancel={() => setPagoDeudaId(undefined)}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={!!deudaABorrar}
        onClose={() => setDeudaABorrar(null)}
        onConfirm={handleDeleteDeuda}
        isLoading={isDeleting}
        titulo="¿Eliminar esta deuda?"
        mensaje={`Se eliminará la deuda "${deudaABorrar?.concepto}" por $${Number(deudaABorrar?.monto_total || 0).toLocaleString('es-AR')}. Los pagos asociados no se borrarán.`}
        textoConfirmar="Sí, eliminar deuda"
      />
    </div>
  );
}
