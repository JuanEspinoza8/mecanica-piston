import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import VehiculoForm from '../components/VehiculoForm';
import { useCreateVehiculo } from '../hooks/useVehiculos';

export default function VehiculoNuevo() {
  const navigate = useNavigate();
  const { mutateAsync: createVehiculo, isPending } = useCreateVehiculo();

  const onSubmit = async (data) => {
    try {
      await createVehiculo(data);
      toast.success('Vehículo registrado correctamente');
      navigate('/vehiculos');
    } catch (error) {
      toast.error(error.message || 'Error al registrar el vehículo');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
      
      <div className="flex items-center space-x-4">
        <Link 
          to="/vehiculos"
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Registrar Vehículo</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Añade un nuevo auto a la flota de un cliente.</p>
        </div>
      </div>

      <VehiculoForm onSubmit={onSubmit} isSubmitting={isPending} />
      
    </div>
  );
}
