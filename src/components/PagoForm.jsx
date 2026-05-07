import { useState } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pagoSchema } from '../lib/schemas';
import { DollarSign, Calendar, FileText, CreditCard, Save, X, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PagoForm({ clienteId, ordenId, onSuccess, onCancel }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useReactHookForm({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      monto: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      metodo: 'Efectivo',
      es_cuota: false,
      cuota_actual: '',
      total_cuotas: '',
      nota: '',
    }
  });

  const isCuota = watch('es_cuota');

  const onSubmit = async (data) => {
    try {
      // Mock del hook useCreatePago de Supabase que hará Juan
      // await createPagoMutation.mutateAsync({ ...data, clienteId, ordenId });
      
      console.log("Simulando guardado de pago:", { ...data, cliente_id: clienteId, orden_id: ordenId });
      
      // Simulamos delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Pago registrado correctamente');
      if (onSuccess) onSuccess(data);
    } catch (error) {
      toast.error('Error al registrar el pago: ' + error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl max-w-2xl w-full mx-auto">
      <div className="bg-neutral-50 dark:bg-neutral-950 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-600 dark:text-green-500" />
          Registrar Nuevo Pago
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        
        {/* Fila 1: Monto y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Monto ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="number"
                step="0.01"
                {...register('monto')}
                className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl focus:outline-none transition-all shadow-sm ${errors.monto ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-neutral-500'}`}
                placeholder="0.00"
              />
            </div>
            {errors.monto && <p className="mt-1 text-xs font-semibold text-red-500">{errors.monto.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input 
                type="date"
                {...register('fecha')}
                className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border rounded-xl focus:outline-none transition-all shadow-sm ${errors.fecha ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-neutral-500'}`}
              />
            </div>
            {errors.fecha && <p className="mt-1 text-xs font-semibold text-red-500">{errors.fecha.message}</p>}
          </div>
        </div>

        {/* Fila 2: Método de Pago */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Método de Pago</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select 
              {...register('metodo')}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-black dark:focus:border-neutral-500 transition-all shadow-sm appearance-none"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
            </select>
          </div>
          {errors.metodo && <p className="mt-1 text-xs font-semibold text-red-500">{errors.metodo.message}</p>}
        </div>

        {/* Sección de Cuotas */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              {...register('es_cuota')}
              className="w-5 h-5 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700 dark:bg-neutral-900 dark:checked:bg-white"
            />
            <span className="font-bold text-neutral-800 dark:text-neutral-200">Este pago corresponde a una cuota</span>
          </label>
          
          {isCuota && (
            <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Cuota N°</label>
                <input 
                  type="number"
                  {...register('cuota_actual')}
                  placeholder="Ej: 1"
                  className={`w-full px-3 py-2 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none transition-all shadow-sm ${errors.cuota_actual ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'}`}
                />
                {errors.cuota_actual && <p className="mt-1 text-xs text-red-500">{errors.cuota_actual.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">De un total de</label>
                <input 
                  type="number"
                  {...register('total_cuotas')}
                  placeholder="Ej: 3"
                  className={`w-full px-3 py-2 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none transition-all shadow-sm ${errors.total_cuotas ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'}`}
                />
                {errors.total_cuotas && <p className="mt-1 text-xs text-red-500">{errors.total_cuotas.message}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Nota Adicional (Opcional)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
            <textarea 
              {...register('nota')}
              rows="3"
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-black dark:focus:border-neutral-500 transition-all shadow-sm resize-none"
              placeholder="Detalles sobre el pago, número de comprobante..."
            ></textarea>
          </div>
          {errors.nota && <p className="mt-1 text-xs font-semibold text-red-500">{errors.nota.message}</p>}
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center"><div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin mr-2"></div> Guardando...</span>
            ) : (
              <span className="flex items-center"><Save className="w-5 h-5 mr-2" /> Registrar Pago</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
