import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import VehiculoForm from '../components/VehiculoForm';

export default function VehiculoNuevo() {
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    console.log("Datos recibidos del vehículo:", data);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Al terminar, volvemos a la lista de vehículos
    navigate('/vehiculos');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6">
      
      <div className="flex items-center space-x-4">
        <Link 
          to="/vehiculos"
          className="p-2 rounded-full hover:bg-neutral-200 transition-colors text-neutral-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Registrar Vehículo</h1>
          <p className="text-neutral-500">Añade un nuevo auto a la flota de un cliente.</p>
        </div>
      </div>

      <VehiculoForm onSubmit={onSubmit} isSubmitting={false} />
      
    </div>
  );
}
