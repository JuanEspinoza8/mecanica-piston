import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ordenSchema } from '../lib/schemas';
import { User, CarFront, FileText, Save, Loader2, Search, Stethoscope, CalendarDays, ListChecks } from 'lucide-react';
import { useVehiculos } from '../hooks/useVehiculos';

const ESTADOS = [
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En proceso', label: 'En proceso' },
  { value: 'Esperando repuesto', label: 'Esperando repuesto' },
  { value: 'Terminado', label: 'Terminado' },
  { value: 'Entregado', label: 'Entregado' },
];

export default function OrdenForm({ defaultValues, onSubmit, isSubmitting }) {
  const { data: vehiculos = [], isLoading } = useVehiculos();
  const clientesMap = new Map();
  vehiculos.forEach(v => {
    if (v.cliente && !clientesMap.has(v.cliente.id)) {
      clientesMap.set(v.cliente.id, v.cliente);
    }
  });
  const clientes = Array.from(clientesMap.values());
  const today = new Date().toISOString().split('T')[0];

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(ordenSchema),
    defaultValues: defaultValues || {
      clienteId: '', vehiculoId: '', sintoma: '',
      diagnostico: '', fecha_ingreso: today, estado: 'Pendiente'
    }
  });

  const clienteIdSeleccionado = watch('clienteId');
  const vehiculosDisponibles = vehiculos.filter(v => v.cliente?.id === clienteIdSeleccionado);
  const inputCls = (err) => `block w-full pl-10 pr-3 py-3 border ${err ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`;
  const selectCls = (err, disabled) => `${inputCls(err)} appearance-none pr-10 ${disabled ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed' : ''}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Cliente *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-neutral-400" /></div>
              <select {...register('clienteId')} disabled={isLoading} className={selectCls(errors.clienteId, false)}>
                <option value="">{isLoading ? 'Cargando...' : 'Seleccione un cliente...'}</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-neutral-400" /></div>
            </div>
            {errors.clienteId && <p className="mt-1 text-sm text-red-600">{errors.clienteId.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Vehículo *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CarFront className="h-5 w-5 text-neutral-400" /></div>
              <select {...register('vehiculoId')} disabled={!clienteIdSeleccionado} className={selectCls(errors.vehiculoId, !clienteIdSeleccionado)}>
                <option value="">{!clienteIdSeleccionado ? 'Primero seleccione un cliente' : 'Seleccione un vehículo...'}</option>
                {vehiculosDisponibles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.patente})</option>)}
              </select>
            </div>
            {errors.vehiculoId && <p className="mt-1 text-sm text-red-600">{errors.vehiculoId.message}</p>}
          </div>
        </div>
        <hr className="border-neutral-100 dark:border-neutral-800" />
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Motivo de Ingreso / Síntoma *</label>
          <p className="text-xs text-neutral-500 mb-2">Describe detalladamente el problema que reporta el cliente.</p>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none"><FileText className="h-5 w-5 text-neutral-400" /></div>
            <textarea {...register('sintoma')} rows={3} className={`${inputCls(errors.sintoma)} resize-none`} placeholder="Ej: Ruido metálico al frenar y vibración en el volante." />
          </div>
          {errors.sintoma && <p className="mt-1 text-sm text-red-600">{errors.sintoma.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Diagnóstico del Mecánico</label>
          <p className="text-xs text-neutral-500 mb-2">Observaciones técnicas (se puede completar después).</p>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none"><Stethoscope className="h-5 w-5 text-neutral-400" /></div>
            <textarea {...register('diagnostico')} rows={3} className={`${inputCls(errors.diagnostico)} resize-none`} placeholder="Ej: Discos de freno desgastados, pastillas al límite." />
          </div>
          {errors.diagnostico && <p className="mt-1 text-sm text-red-600">{errors.diagnostico.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Fecha de Ingreso</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarDays className="h-5 w-5 text-neutral-400" /></div>
              <input type="date" {...register('fecha_ingreso')} className={inputCls(errors.fecha_ingreso)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Estado</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ListChecks className="h-5 w-5 text-neutral-400" /></div>
              <select {...register('estado')} className={selectCls(errors.estado, false)}>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting} className="flex items-center justify-center w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-1">
          {isSubmitting ? (<><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />Creando Orden...</>) : (<><Save className="-ml-1 mr-2 h-5 w-5" />Crear Orden de Trabajo</>)}
        </button>
      </div>
    </form>
  );
}
