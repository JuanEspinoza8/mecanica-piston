import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { deudaSchema } from '../lib/schemas';
import { DollarSign, X, Save, CreditCard, FileText, Loader2 } from 'lucide-react';
import { useCreateDeuda } from '../hooks/useDeudas';

export default function CrearDeudaModal({ isOpen, onClose, clienteId, ordenId, defaultConcepto, defaultMonto }) {
  const createDeuda = useCreateDeuda();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(deudaSchema),
    defaultValues: {
      concepto: defaultConcepto || '',
      monto_total: defaultMonto ? defaultMonto.toLocaleString('es-AR') : '',
      en_cuotas: false,
      cantidad_cuotas: 1,
    },
  });

  // Reset form with latest values every time the modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        concepto: defaultConcepto || '',
        monto_total: defaultMonto ? defaultMonto.toLocaleString('es-AR') : '',
        en_cuotas: false,
        cantidad_cuotas: 1,
      });
    }
  }, [isOpen, defaultConcepto, defaultMonto, reset]);

  const enCuotas = watch('en_cuotas');
  const cantidadCuotas = watch('cantidad_cuotas');
  const montoInput = watch('monto_total');

  // Calcular monto numérico para preview
  const montoNum = (() => {
    if (!montoInput) return 0;
    if (typeof montoInput === 'number') return montoInput;
    return Number(String(montoInput).replace(/\./g, '').replace(',', '.')) || 0;
  })();

  const valorCuota = enCuotas && cantidadCuotas > 0 ? montoNum / cantidadCuotas : montoNum;

  const handleMontoChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue) {
      e.target.value = parseInt(rawValue, 10).toLocaleString('es-AR');
    }
  };

  const onSubmit = async (data) => {
    try {
      await createDeuda.mutateAsync({
        cliente_id: clienteId,
        orden_id: ordenId || null,
        concepto: data.concepto,
        monto_total: data.monto_total,
        en_cuotas: data.en_cuotas,
        cantidad_cuotas: data.en_cuotas ? data.cantidad_cuotas : 1,
      });
      onClose();
    } catch (e) {
      // error handled in hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-red-500" />
            Crear Deuda
          </h3>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Concepto */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Concepto</label>
            <input
              type="text"
              {...register('concepto')}
              placeholder="Ej: Reparación completa motor..."
              className={`w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border rounded-xl text-sm focus:outline-none transition-all ${errors.concepto ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-red-500'} text-neutral-900 dark:text-white`}
            />
            {errors.concepto && <p className="mt-1 text-xs text-red-500">{errors.concepto.message}</p>}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Monto Total ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
              <input
                type="text"
                {...register('monto_total', { onChange: handleMontoChange })}
                placeholder="0"
                className={`w-full pl-11 pr-4 py-3 text-2xl font-black bg-neutral-50 dark:bg-neutral-800 border rounded-xl focus:outline-none transition-all ${errors.monto_total ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700 focus:border-red-500'} text-neutral-900 dark:text-white`}
              />
            </div>
            {errors.monto_total && <p className="mt-1 text-xs text-red-500">{errors.monto_total.message}</p>}
          </div>

          {/* Cuotas */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('en_cuotas')}
                className="w-5 h-5 rounded border-neutral-300 text-red-600 focus:ring-red-500"
              />
              <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">Pago en cuotas</span>
            </label>

            {enCuotas && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Cantidad de cuotas</label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    {...register('cantidad_cuotas')}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:border-red-500 text-neutral-900 dark:text-white"
                  />
                  {errors.cantidad_cuotas && <p className="mt-1 text-xs text-red-500">{errors.cantidad_cuotas.message}</p>}
                </div>

                {montoNum > 0 && cantidadCuotas > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      {cantidadCuotas} cuotas de ${valorCuota.toLocaleString('es-AR', { maximumFractionDigits: 0 })} c/u
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createDeuda.isPending}
              className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-red-600/20 text-sm"
            >
              {createDeuda.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Crear Deuda</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
