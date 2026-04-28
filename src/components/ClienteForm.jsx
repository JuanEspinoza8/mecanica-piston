import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema } from '../lib/schemas';
import { User, Phone, Mail, MapPin, Save, Loader2 } from 'lucide-react';

export default function ClienteForm({ defaultValues, onSubmit, isSubmitting }) {
  // Inicializamos React Hook Form con nuestro esquema de Zod
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: defaultValues || {
      nombre: '',
      telefono: '',
      email: '',
      direccion: ''
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Tarjeta del Formulario */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
        
        {/* Campo: Nombre */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nombre Completo *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              type="text"
              {...register('nombre')}
              className={`block w-full pl-10 pr-3 py-2 border ${errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          {errors.nombre && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre.message}</p>}
        </div>

        {/* Campo: Teléfono */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Teléfono *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              type="text"
              {...register('telefono')}
              className={`block w-full pl-10 pr-3 py-2 border ${errors.telefono ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`}
              placeholder="Ej: +54 9 11 1234-5678"
            />
          </div>
          {errors.telefono && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefono.message}</p>}
        </div>

        {/* Campo: Email (Opcional) */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email (Opcional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              type="email"
              {...register('email')}
              className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`}
              placeholder="Ej: juan@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
        </div>

        {/* Campo: Dirección (Opcional) */}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Dirección (Opcional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              type="text"
              {...register('direccion')}
              className="block w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-red-500 focus:border-black dark:focus:border-red-500 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white"
              placeholder="Ej: Av. San Martín 1234"
            />
          </div>
        </div>

      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center w-full sm:w-auto bg-black dark:bg-red-600 hover:bg-neutral-900 dark:hover:bg-red-700 disabled:bg-neutral-400 dark:disabled:bg-red-900 text-white font-semibold py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="-ml-1 mr-2 h-5 w-5" />
              Guardar Cliente
            </>
          )}
        </button>
      </div>
    </form>
  );
}
