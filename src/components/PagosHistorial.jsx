import { useState } from 'react';
import { Calendar, CreditCard, Receipt, Wallet, ArrowUpRight, Loader2, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePagos, useDeletePago } from '../hooks/usePagos';
import ConfirmModal from './ConfirmModal';

export default function PagosHistorial({ clienteId }) {
  const { data: pagos, isLoading } = usePagos(clienteId);
  const { mutateAsync: deletePago, isPending: isDeleting } = useDeletePago();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const getMetodoColor = (metodo) => {
    switch (metodo) {
      case 'Efectivo': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'Transferencia': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Mercado Pago': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800/50';
      case 'Tarjeta': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800/50';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-2" />
        <p className="text-neutral-500 font-medium">Cargando historial de pagos...</p>
      </div>
    );
  }

  if (!pagos || pagos.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-10 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Receipt className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No hay pagos registrados</h3>
        <p className="text-neutral-500 dark:text-neutral-400">Este cliente aún no ha realizado ningún pago.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-neutral-500" />
            Historial de Pagos
          </h3>
          <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2 py-1 rounded-full">
            {pagos.length} registros
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
          {pagos.map(pago => (
            <div key={pago.id} className="p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              
              <div className="flex items-start gap-4">
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-xl shrink-0">
                  <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
                
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getMetodoColor(pago.metodo_pago)}`}>
                      {pago.metodo_pago}
                    </span>
                    {pago.deudas && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                        {pago.deudas.concepto}
                      </span>
                    )}
                  </div>
                  
                  {pago.nota && (
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 line-clamp-1">
                      {pago.nota}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {format(new Date(pago.fecha), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right shrink-0 flex flex-col items-end gap-2">
                <span className="text-lg font-black text-neutral-900 dark:text-white">
                  ${Number(pago.monto).toLocaleString('es-AR')}
                </span>
                <div className="flex items-center gap-2">
                  {pago.comprobante_url && (
                    <a 
                      href={pago.comprobante_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </a>
                  )}
                  <button
                    onClick={() => setDeleteTarget(pago)}
                    className="opacity-0 group-hover:opacity-100 flex items-center text-xs font-bold text-red-500 hover:text-red-600 transition-all bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded"
                    title="Eliminar pago"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Confirmar eliminar pago */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            try {
              await deletePago({
                id: deleteTarget.id,
                cliente_id: deleteTarget.cliente_id,
                deuda_id: deleteTarget.deuda_id,
                monto: deleteTarget.monto,
              });
              setDeleteTarget(null);
            } catch (e) {}
          }
        }}
        isLoading={isDeleting}
        titulo="¿Eliminar este pago?"
        mensaje={`Se eliminará el pago de $${Number(deleteTarget?.monto || 0).toLocaleString('es-AR')}. Si estaba vinculado a una deuda, el saldo pendiente se actualizará.`}
        textoConfirmar="Sí, eliminar pago"
      />
    </>
  );
}
