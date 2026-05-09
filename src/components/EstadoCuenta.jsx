import { usePagos, useSaldoCliente } from '../hooks/usePagos';
import { DollarSign, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function EstadoCuenta({ clienteId, onRegistrarPago }) {
  const { data: saldo, isLoading: isLoadingSaldo } = useSaldoCliente(clienteId);
  const { data: pagos, isLoading: isLoadingPagos } = usePagos(clienteId);

  if (isLoadingSaldo || isLoadingPagos) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mb-4" />
        <p className="text-neutral-500 font-medium">Calculando estado de cuenta...</p>
      </div>
    );
  }

  // Calculamos totales basados en la RPC y la lista de pagos
  const totalPagado = pagos?.reduce((sum, pago) => sum + Number(pago.monto), 0) || 0;
  const saldoPendiente = saldo || 0;
  
  // Como la RPC devuelve: Saldo = Costos Totales - Pagos Totales
  // Entonces: Costos Totales = Saldo + Pagos Totales
  const totalTrabajos = Number(saldoPendiente) + totalPagado; 

  const estaAlDia = saldoPendiente <= 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm flex flex-col md:flex-row">
      
      <div className={`p-6 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 ${estaAlDia ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-red-50/50 dark:bg-red-900/10'}`}>
        <div className="flex items-center space-x-2 mb-2">
          {estaAlDia ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
          )}
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Estado de Cuenta</h3>
        </div>
        
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Saldo Pendiente</p>
          <p className={`text-4xl font-black tracking-tight ${estaAlDia ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            ${Math.max(0, saldoPendiente).toLocaleString('es-AR')}
          </p>
          <p className={`text-sm font-medium mt-1 ${estaAlDia ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {estaAlDia ? 'El cliente está al día' : 'El cliente registra deuda'}
          </p>
        </div>
      </div>

      <div className="p-6 flex-1 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Total en Trabajos</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">${totalTrabajos.toLocaleString('es-AR')}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Total Pagado</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">${totalPagado.toLocaleString('es-AR')}</p>
        </div>
        
        <div className="col-span-2 mt-4">
          <button 
            onClick={onRegistrarPago}
            className="w-full flex items-center justify-center bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Registrar Pago
          </button>
        </div>
      </div>

    </div>
  );
}
