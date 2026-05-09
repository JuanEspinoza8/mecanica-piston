import { DollarSign, Calendar, FileText, CreditCard, Receipt, Wallet, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export default function PagosHistorial({ clienteId }) {
  // Mock de pagos por ahora, Juan luego hará el hook usePagos(clienteId)
  const pagos = [
    {
      id: 1,
      fecha: '2026-05-06',
      monto: 15000,
      metodo: 'Transferencia',
      es_cuota: true,
      cuota_actual: 1,
      total_cuotas: 3,
      nota: 'Pago inicial por cambio de distribución',
    },
    {
      id: 2,
      fecha: '2026-04-20',
      monto: 8500,
      metodo: 'Efectivo',
      es_cuota: false,
      nota: 'Alineación y balanceo',
    },
    {
      id: 3,
      fecha: '2026-03-15',
      monto: 32000,
      metodo: 'Mercado Pago',
      es_cuota: false,
      nota: 'Cambio de embrague',
    }
  ];

  const getMetodoColor = (metodo) => {
    switch (metodo) {
      case 'Efectivo': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'Transferencia': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Mercado Pago': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800/50';
      case 'Tarjeta': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800/50';
      default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

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
          <div key={pago.id} className="p-4 sm:p-6 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start gap-4">
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-xl shrink-0">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getMetodoColor(pago.metodo)}`}>
                    {pago.metodo}
                  </span>
                  
                  {pago.es_cuota && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-400 flex items-center">
                      Cuota {pago.cuota_actual} de {pago.total_cuotas}
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

            <div className="text-right sm:text-right shrink-0">
              <span className="text-lg font-black text-neutral-900 dark:text-white">
                ${pago.monto.toLocaleString('es-AR')}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
