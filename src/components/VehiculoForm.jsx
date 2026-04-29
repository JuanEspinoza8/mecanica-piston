import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehiculoSchema } from '../lib/schemas';
import { User, CarFront, Hash, Calendar, Palette, Save, Loader2, Search } from 'lucide-react';

export default function VehiculoForm({ defaultValues, onSubmit, isSubmitting }) {
  // Mock data para los dueños
  const clientesMock = [
    { id: '1', nombre: 'Juan Pérez' },
    { id: '2', nombre: 'María Gómez' },
    { id: '3', nombre: 'Carlos López' }
  ];

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: defaultValues || {
      patente: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      color: '',
      clienteId: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-6">
        
        {/* Fila 1: Cliente y Patente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Dueño (Cliente) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-neutral-400" />
              </div>
              <select
                {...register('clienteId')}
                className={`block w-full pl-10 pr-10 py-3 border ${errors.clienteId ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-black'} rounded-xl focus:outline-none focus:ring-1 transition-colors appearance-none bg-white`}
              >
                <option value="">Seleccione el dueño...</option>
                {clientesMock.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
            </div>
            {errors.clienteId && <p className="mt-1 text-sm text-red-600">{errors.clienteId.message}</p>}
          </div>

          {/* Patente */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Patente / Dominio *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                {...register('patente')}
                className={`block w-full pl-10 pr-3 py-3 border ${errors.patente ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-black'} rounded-xl focus:outline-none focus:ring-1 transition-colors uppercase`}
                placeholder="Ej: AB123CD"
              />
            </div>
            {errors.patente && <p className="mt-1 text-sm text-red-600">{errors.patente.message}</p>}
          </div>
        </div>

        {/* Fila 2: Marca y Modelo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marca */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Marca *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CarFront className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                {...register('marca')}
                className={`block w-full pl-10 pr-3 py-3 border ${errors.marca ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-black'} rounded-xl focus:outline-none focus:ring-1 transition-colors`}
                placeholder="Ej: Ford"
              />
            </div>
            {errors.marca && <p className="mt-1 text-sm text-red-600">{errors.marca.message}</p>}
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Modelo *</label>
            <input
              type="text"
              {...register('modelo')}
              className={`block w-full px-4 py-3 border ${errors.modelo ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-black'} rounded-xl focus:outline-none focus:ring-1 transition-colors`}
              placeholder="Ej: Fiesta Titanium"
            />
            {errors.modelo && <p className="mt-1 text-sm text-red-600">{errors.modelo.message}</p>}
          </div>
        </div>

        {/* Fila 3: Año y Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Año */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Año *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="number"
                {...register('año')}
                className={`block w-full pl-10 pr-3 py-3 border ${errors.año ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-black'} rounded-xl focus:outline-none focus:ring-1 transition-colors`}
                placeholder="Ej: 2018"
              />
            </div>
            {errors.año && <p className="mt-1 text-sm text-red-600">{errors.año.message}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Color</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Palette className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                {...register('color')}
                className="block w-full pl-10 pr-3 py-3 border border-neutral-300 focus:border-black rounded-xl focus:outline-none focus:ring-1 focus:ring-black transition-colors"
                placeholder="Ej: Gris Plata"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center w-full sm:w-auto bg-black hover:bg-neutral-900 disabled:bg-neutral-400 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Guardando Vehículo...
            </>
          ) : (
            <>
              <Save className="-ml-1 mr-2 h-5 w-5" />
              Registrar Vehículo
            </>
          )}
        </button>
      </div>
    </form>
  );
}
