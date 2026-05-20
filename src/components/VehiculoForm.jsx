import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vehiculoSchema } from '../lib/schemas';
import { User, CarFront, Hash, Calendar, Save, Loader2, Search, ChevronDown } from 'lucide-react';
import { useClientes } from '../hooks/useClientes';
import { marcas, getModelos } from '../data/vehiculoCatalog';
import { useState, useEffect } from 'react';

export default function VehiculoForm({ defaultValues, onSubmit, isSubmitting, hideClienteField }) {
  const { data: clientes = [], isLoading: isLoadingClientes } = useClientes();
  const [modelosSugeridos, setModelosSugeridos] = useState([]);
  const [marcaCustom, setMarcaCustom] = useState(false);
  const [modeloCustom, setModeloCustom] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
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

  const marcaActual = watch('marca');

  // Update model suggestions when brand changes
  useEffect(() => {
    const modelos = getModelos(marcaActual);
    setModelosSugeridos(modelos);
    // If brand is in catalog, show dropdown for modelo; otherwise free text
    setModeloCustom(!marcas.includes(marcaActual));
  }, [marcaActual]);

  // Check if current default marca is in catalog
  useEffect(() => {
    if (defaultValues?.marca && !marcas.includes(defaultValues.marca)) {
      setMarcaCustom(true);
    }
    if (defaultValues?.modelo) {
      const modelos = getModelos(defaultValues.marca);
      if (!modelos.includes(defaultValues.modelo)) {
        setModeloCustom(true);
      }
    }
  }, [defaultValues]);

  const handleMarcaSelect = (value) => {
    if (value === '__custom__') {
      setMarcaCustom(true);
      setValue('marca', '');
      setValue('modelo', '');
    } else {
      setMarcaCustom(false);
      setValue('marca', value);
      setValue('modelo', '');
    }
  };

  const handleModeloSelect = (value) => {
    if (value === '__custom__') {
      setModeloCustom(true);
      setValue('modelo', '');
    } else {
      setModeloCustom(false);
      setValue('modelo', value);
    }
  };

  const fieldClass = (hasError) =>
    `block w-full pl-10 pr-3 py-3 border ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`;

  const selectClass = (hasError) =>
    `block w-full pl-10 pr-10 py-3 border ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors appearance-none bg-transparent dark:bg-neutral-950 dark:text-white`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-6">
        
        {/* Fila 1: Cliente y Patente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente */}
          {!hideClienteField && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Dueño (Cliente) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <select
                  {...register('clienteId')}
                  disabled={isLoadingClientes}
                  className={selectClass(errors.clienteId)}
                >
                  <option value="" className="dark:bg-neutral-900">
                    {isLoadingClientes ? "Cargando clientes..." : "Seleccione el dueño..."}
                  </option>
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
          )}
          {/* Hidden clienteId when field is hidden (edit mode) */}
          {hideClienteField && <input type="hidden" {...register('clienteId')} />}

          {/* Patente */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Patente / Dominio *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                type="text"
                {...register('patente')}
                className={`${fieldClass(errors.patente)} uppercase`}
                placeholder="Ej: AB123CD o ABC 123"
              />
            </div>
            {errors.patente && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.patente.message}</p>}
          </div>
        </div>

        {/* Fila 2: Marca y Modelo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Marca */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Marca *</label>
            {!marcaCustom ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CarFront className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <select
                  value={marcaActual}
                  onChange={(e) => handleMarcaSelect(e.target.value)}
                  className={selectClass(errors.marca)}
                >
                  <option value="" className="dark:bg-neutral-900">Seleccionar marca...</option>
                  {marcas.map(m => (
                    <option key={m} value={m} className="dark:bg-neutral-900">{m}</option>
                  ))}
                  <option value="__custom__" className="dark:bg-neutral-900 font-semibold">✏️ Escribir otra marca...</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CarFront className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <input
                  type="text"
                  {...register('marca')}
                  className={fieldClass(errors.marca)}
                  placeholder="Escribí la marca..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setMarcaCustom(false); setValue('marca', ''); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Lista ▾
                </button>
              </div>
            )}
            {/* Hidden field for react-hook-form when using select */}
            {!marcaCustom && <input type="hidden" {...register('marca')} />}
            {errors.marca && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.marca.message}</p>}
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Modelo *</label>
            {!modeloCustom && modelosSugeridos.length > 0 ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CarFront className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <select
                  value={watch('modelo')}
                  onChange={(e) => handleModeloSelect(e.target.value)}
                  className={selectClass(errors.modelo)}
                >
                  <option value="" className="dark:bg-neutral-900">Seleccionar modelo...</option>
                  {modelosSugeridos.map(m => (
                    <option key={m} value={m} className="dark:bg-neutral-900">{m}</option>
                  ))}
                  <option value="__custom__" className="dark:bg-neutral-900 font-semibold">✏️ Escribir otro modelo...</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </div>
                {/* Hidden field for react-hook-form */}
                <input type="hidden" {...register('modelo')} />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CarFront className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <input
                  type="text"
                  {...register('modelo')}
                  className={fieldClass(errors.modelo)}
                  placeholder="Ej: Fiesta Titanium"
                />
                {modelosSugeridos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setModeloCustom(false); setValue('modelo', ''); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    Lista ▾
                  </button>
                )}
              </div>
            )}
            {errors.modelo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.modelo.message}</p>}
          </div>
        </div>

        {/* Fila 3: Año */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Año */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Año *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                type="number"
                {...register('año')}
                className={fieldClass(errors.año)}
                placeholder="Ej: 2018"
              />
            </div>
            {errors.año && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.año.message}</p>}
          </div>

          {/* Espacio vacío */}
          <div className="hidden md:block"></div>
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
              {defaultValues ? 'Guardar Cambios' : 'Registrar Vehículo'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
