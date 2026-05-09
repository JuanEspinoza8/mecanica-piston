import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ordenSchema } from '../lib/schemas';
import { User, CarFront, FileText, Save, Loader2, Search } from 'lucide-react';
import { useVehiculos } from '../hooks/useVehiculos';

export default function OrdenForm({ defaultValues, onSubmit, isSubmitting }) {
  const { data: vehiculos = [], isLoading } = useVehiculos();
  
  // Extraer clientes únicos de la lista de vehículos
  const clientesMap = new Map();
  vehiculos.forEach(v => {
    if (v.cliente && !clientesMap.has(v.cliente.id)) {
      clientesMap.set(v.cliente.id, v.cliente);
    }
  });
  const clientes = Array.from(clientesMap.values());

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(ordenSchema),
    defaultValues: defaultValues || {
      clienteId: '',
      vehiculoId: '',
      sintoma: ''
    }
  });

  // Observamos el cliente seleccionado para saber qué vehículos mostrar
  const clienteIdSeleccionado = watch('clienteId');
  const vehiculosDisponibles = vehiculos.filter(v => v.cliente?.id === clienteIdSeleccionado);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campo: Cliente */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Cliente *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </div>
              <select
                {...register('clienteId')}
                disabled={isLoading}
                className={`block w-full pl-10 pr-10 py-3 border ${errors.clienteId ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors appearance-none bg-transparent dark:bg-neutral-950 dark:text-white`}
              >
                <option value="" className="dark:bg-neutral-900">{isLoading ? 'Cargando...' : 'Seleccione un cliente...'}</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-neutral-900">{c.nombre} {c.apellido || ''}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
              </div>
            </div>
            {errors.clienteId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clienteId.message}</p>}
          </div>

          {/* Campo: Vehículo (depende del cliente) */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Vehículo *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CarFront className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </div>
              <select
                {...register('vehiculoId')}
                disabled={!clienteIdSeleccionado}
                className={`block w-full pl-10 pr-10 py-3 border ${errors.vehiculoId ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors appearance-none ${!clienteIdSeleccionado ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed' : 'bg-transparent dark:bg-neutral-950 dark:text-white'}`}
              >
                <option value="" className="dark:bg-neutral-900">
                  {!clienteIdSeleccionado ? 'Primero seleccione un cliente' : 'Seleccione un vehículo...'}
                </option>
                {vehiculosDisponibles.map(v => (
                  <option key={v.id} value={v.id} className="dark:bg-neutral-900">{v.marca} {v.modelo} ({v.patente})</option>
                ))}
              </select>
            </div>
            {errors.vehiculoId && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vehiculoId.message}</p>}
          </div>
        </div>

        <hr className="border-neutral-100 dark:border-neutral-800" />

        {/* Campo: Motivo de Ingreso / Síntoma */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Motivo de Ingreso / Síntoma *
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            Describe detalladamente el problema que reporta el cliente o el motivo del servicio.
          </p>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <FileText className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <textarea
              {...register('sintoma')}
              rows={4}
              className={`block w-full pl-10 pr-3 py-3 border ${errors.sintoma ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors resize-none bg-transparent dark:bg-neutral-950 dark:text-white`}
              placeholder="Ej: El cliente reporta ruido metálico al frenar y vibración en el volante a más de 80km/h."
            ></textarea>
          </div>
          {errors.sintoma && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sintoma.message}</p>}
        </div>

      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-900 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg shadow-red-600/30 hover:shadow-xl hover:-translate-y-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Creando Orden...
            </>
          ) : (
            <>
              <Save className="-ml-1 mr-2 h-5 w-5" />
              Crear Orden de Trabajo
            </>
          )}
        </button>
      </div>
    </form>
  );
}
