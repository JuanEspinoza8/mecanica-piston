import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import OrdenForm from '../components/OrdenForm';
import { useCreateOrden } from '../hooks/useOrdenes';

export default function OrdenNueva() {
  const navigate = useNavigate();
  const { mutateAsync: createOrden, isPending } = useCreateOrden();

  // Función que se ejecuta cuando el formulario es válido y se envía
  const onSubmit = async (data) => {
    try {
      await createOrden(data);
      toast.success('Orden creada correctamente');
      navigate('/ordenes');
    } catch (error) {
      toast.error(error.message || 'Error al crear la orden');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
      
      {/* Botón volver y Título */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/ordenes"
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Nueva Orden de Trabajo</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Ingresa un vehículo al taller y abre su bitácora.</p>
        </div>
      </div>

      {/* Componente del Formulario */}
      <OrdenForm onSubmit={onSubmit} isSubmitting={isPending} />
      
    </div>
  );
}
