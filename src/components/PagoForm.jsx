import { useState, useMemo } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pagoSchema } from '../lib/schemas';
import { DollarSign, Calendar, FileText, CreditCard, Save, X, UploadCloud, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCreatePago } from '../hooks/usePagos';
import { useDeudasPendientes } from '../hooks/useDeudas';

export default function PagoForm({ clienteId, ordenId, onSuccess, onCancel, preselectedDeudaId }) {
  const { data: deudasPendientes = [] } = useDeudasPendientes(clienteId);
  const createPagoMutation = useCreatePago();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useReactHookForm({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      deuda_id: preselectedDeudaId || '',
      monto: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      metodo: 'Efectivo',
      nota: '',
    }
  });

  const [archivoPDF, setArchivoPDF] = useState(null);
  const selectedDeudaId = watch('deuda_id');
  const montoInput = watch('monto');

  // Deuda seleccionada
  const deudaSeleccionada = useMemo(() => {
    return deudasPendientes.find(d => d.id === selectedDeudaId) || null;
  }, [selectedDeudaId, deudasPendientes]);

  // Cálculo de cuotas cubierto por el pago
  const cuotaInfo = useMemo(() => {
    if (!deudaSeleccionada || !deudaSeleccionada.en_cuotas) return null;

    const montoNum = typeof montoInput === 'string'
      ? Number(montoInput.replace(/\./g, '').replace(',', '.'))
      : Number(montoInput);

    if (!montoNum || montoNum <= 0) return null;

    const { monto_total, monto_pagado, cantidad_cuotas } = deudaSeleccionada;
    const valorCuota = Number(monto_total) / cantidad_cuotas;
    const cuotasYaPagadas = Math.floor(Number(monto_pagado) / valorCuota);
    const totalPagadoConEste = Number(monto_pagado) + montoNum;
    const cuotasCubiertas = Math.min(Math.floor(totalPagadoConEste / valorCuota), cantidad_cuotas);
    const resto = totalPagadoConEste - (cuotasCubiertas * valorCuota);

    return {
      valorCuota,
      cuotasYaPagadas,
      cuotasCubiertas,
      resto: resto > 0 && cuotasCubiertas < cantidad_cuotas ? resto : 0,
      totalCuotas: cantidad_cuotas,
      pagaCompleto: totalPagadoConEste >= Number(monto_total),
    };
  }, [deudaSeleccionada, montoInput]);

  const saldoPendiente = deudaSeleccionada
    ? Number(deudaSeleccionada.monto_total) - Number(deudaSeleccionada.monto_pagado)
    : 0;

  const handleMontoChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue) {
      e.target.value = parseInt(rawValue, 10).toLocaleString('es-AR');
    }
  };

  const handlePagoTotal = () => {
    if (saldoPendiente > 0) {
      setValue('monto', saldoPendiente.toLocaleString('es-AR'));
    }
  };

  const onSubmit = async (data) => {
    try {
      await createPagoMutation.mutateAsync({
        ...data,
        cliente_id: clienteId,
        deuda_id: data.deuda_id || null,
        orden_id: ordenId || null,
        archivoPDF,
      });
      if (onSuccess) onSuccess(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
      <div className="bg-neutral-50 dark:bg-neutral-950 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-600 dark:text-green-500" />
          Registrar Pago
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

        {/* Seleccionar Deuda */}
        {deudasPendientes.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">¿A qué deuda va este pago?</label>
            <div className="relative">
              <select
                {...register('deuda_id')}
                className="w-full px-4 py-3 pr-10 text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-green-500 dark:focus:border-green-500 transition-all shadow-sm appearance-none text-sm"
              >
                <option value="">Sin vincular a deuda</option>
                {deudasPendientes.map(d => {
                  const pendiente = Number(d.monto_total) - Number(d.monto_pagado);
                  const vehiculo = d.ordenes_trabajo?.vehiculos;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.concepto} — Pendiente: ${pendiente.toLocaleString('es-AR')}
                      {vehiculo ? ` (${vehiculo.patente})` : ''}
                      {d.en_cuotas ? ` [${d.cantidad_cuotas} cuotas]` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Info de la deuda seleccionada */}
        {deudaSeleccionada && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400 font-medium">Monto total de deuda</span>
              <span className="font-bold text-green-800 dark:text-green-300">${Number(deudaSeleccionada.monto_total).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-400 font-medium">Ya pagado</span>
              <span className="font-bold text-green-800 dark:text-green-300">${Number(deudaSeleccionada.monto_pagado).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-green-200 dark:border-green-900/50 pt-2">
              <span className="text-green-700 dark:text-green-400 font-bold">Saldo pendiente</span>
              <span className="font-black text-green-800 dark:text-green-300">${saldoPendiente.toLocaleString('es-AR')}</span>
            </div>
            {deudaSeleccionada.en_cuotas && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {deudaSeleccionada.cantidad_cuotas} cuotas de ${(Number(deudaSeleccionada.monto_total) / deudaSeleccionada.cantidad_cuotas).toLocaleString('es-AR')} c/u
              </p>
            )}
          </div>
        )}

        {/* Monto */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">Monto ($)</label>
            {deudaSeleccionada && saldoPendiente > 0 && (
              <button
                type="button"
                onClick={handlePagoTotal}
                className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                Pago total (${saldoPendiente.toLocaleString('es-AR')})
              </button>
            )}
          </div>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 text-neutral-400" />
            <input
              type="text"
              {...register('monto', { onChange: handleMontoChange })}
              className={`w-full pl-14 pr-4 py-4 text-3xl font-black text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border-2 rounded-xl focus:outline-none transition-all shadow-sm ${errors.monto ? 'border-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-green-500 dark:focus:border-green-500'}`}
              placeholder="0"
            />
          </div>
          {errors.monto && <p className="mt-1 text-xs font-semibold text-red-500">{errors.monto.message}</p>}
        </div>

        {/* Tracking de cuotas */}
        {cuotaInfo && (
          <div className={`rounded-xl p-4 border ${cuotaInfo.pagaCompleto ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50' : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'} animate-in fade-in duration-200`}>
            <div className="flex items-start gap-2">
              {cuotaInfo.pagaCompleto ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {cuotaInfo.pagaCompleto ? (
                  <p className="font-bold text-green-700 dark:text-green-400">Este pago salda la deuda completa ✓</p>
                ) : (
                  <>
                    <p className="font-bold text-blue-700 dark:text-blue-400">
                      Cubre hasta cuota {cuotaInfo.cuotasCubiertas} de {cuotaInfo.totalCuotas}
                    </p>
                    {cuotaInfo.resto > 0 && (
                      <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">
                        + ${cuotaInfo.resto.toLocaleString('es-AR')} de adelanto en cuota {cuotaInfo.cuotasCubiertas + 1}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fecha y Método */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="date"
                {...register('fecha')}
                className={`w-full pl-10 pr-4 py-3 text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border rounded-xl focus:outline-none transition-all shadow-sm ${errors.fecha ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:border-green-500'}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Método de Pago</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <select
                {...register('metodo')}
                className="w-full pl-10 pr-4 py-3 text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-green-500 transition-all shadow-sm appearance-none"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Mercado Pago">Mercado Pago</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nota */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Nota (Opcional)</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
            <textarea
              {...register('nota')}
              rows="2"
              className="w-full pl-10 pr-4 py-3 text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-green-500 transition-all shadow-sm resize-none text-sm"
              placeholder="Detalles del pago..."
            ></textarea>
          </div>
        </div>

        {/* Comprobante */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Comprobante (Opcional)</label>
          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-neutral-300 dark:border-neutral-700 border-dashed rounded-xl cursor-pointer bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-neutral-500" />
              <span className="text-sm text-neutral-500 font-medium">
                {archivoPDF ? archivoPDF.name : "Adjuntar PDF"}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) setArchivoPDF(e.target.files[0]);
              }}
            />
          </label>
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
            disabled={createPagoMutation.isPending}
            className="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg shadow-green-600/20"
          >
            {createPagoMutation.isPending ? (
              <span className="flex items-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Guardando...</span>
            ) : (
              <span className="flex items-center"><Save className="w-5 h-5 mr-2" /> Registrar Pago</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
