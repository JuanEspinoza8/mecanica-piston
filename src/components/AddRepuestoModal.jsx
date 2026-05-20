import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, PackageOpen, DollarSign, FileUp, Hash, Loader2 } from 'lucide-react';

const repuestoSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  cantidad: z.number().min(1, "La cantidad mínima es 1"),
  precio: z.number().min(0, "El precio no puede ser negativo")
});

import { useAddRepuesto } from '../hooks/useOrdenes';
import { useFileUpload } from '../hooks/useArchivos';
import { toast } from 'sonner';

export default function AddRepuestoModal({ isOpen, onClose, ordenId }) {
  const { mutateAsync: addRepuesto, isPending: isAdding } = useAddRepuesto();
  const { mutateAsync: uploadFile, isPending: isUploading } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(repuestoSchema),
    defaultValues: {
      nombre: '',
      cantidad: 1,
      precio: 0
    }
  });

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const onSubmit = async (data) => {
    try {
      await addRepuesto({
        ordenId,
        nombre: data.nombre,
        costo: data.precio,
        cantidad: data.cantidad
      });
      
      if (selectedFile) {
        const tipo = selectedFile.type.startsWith('image/') ? 'imagen' : 'documento';
        await uploadFile({ file: selectedFile, ordenId, tipo });
        toast.success("Repuesto y archivo añadidos");
      } else {
        toast.success("Repuesto añadido");
      }
      
      reset();
      setSelectedFileName('');
      setSelectedFile(null);
      onClose();
    } catch (e) {
      toast.error("Error al añadir repuesto");
    }
  };

  const handleClose = () => {
    reset();
    setSelectedFileName('');
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-xl">
              <PackageOpen className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Añadir Repuesto</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Descripción / Nombre del Repuesto *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PackageOpen className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
              </div>
              <input
                type="text"
                {...register('nombre')}
                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.nombre ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`}
                placeholder="Ej: Pastillas de Freno Delanteras"
              />
            </div>
            {errors.nombre && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Cantidad */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Cantidad *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <input
                  type="number"
                  {...register('cantidad', { valueAsNumber: true })}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.cantidad ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`}
                  min="1"
                />
              </div>
              {errors.cantidad && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.cantidad.message}</p>}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Precio Unitario ($) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                </div>
                <input
                  type="number"
                  {...register('precio', { valueAsNumber: true })}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${errors.precio ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-black dark:focus:ring-red-500'} rounded-xl focus:outline-none focus:ring-1 transition-colors bg-transparent dark:bg-neutral-950 dark:text-white`}
                  placeholder="0.00"
                  min="0"
                />
              </div>
              {errors.precio && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.precio.message}</p>}
            </div>
          </div>

          {/* Subida de Comprobante (Falsa/Visual) */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Factura / Comprobante (Opcional)</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:border-red-400 dark:hover:border-red-500 transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-6 h-6 text-neutral-400 dark:text-neutral-500 mb-1 group-hover:text-red-500 transition-colors" />
                {selectedFileName ? (
                  <p className="text-sm font-bold text-red-600 truncate px-4 text-center max-w-[300px]">
                    {selectedFileName}
                  </p>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400"><span className="font-semibold text-neutral-700 dark:text-neutral-300">Haz clic para subir</span> o arrastra un archivo</p>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Formatos soportados: PDF, JPG, PNG.</p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isAdding || isUploading}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors shadow-lg shadow-red-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {(isAdding || isUploading) ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Guardando</>
              ) : (
                'Añadir a la Orden'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
