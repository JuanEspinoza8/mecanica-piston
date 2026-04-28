import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ClienteForm from '../components/ClienteForm';

export default function ClienteNuevo() {
  const navigate = useNavigate();

  // Función que se ejecuta cuando el formulario es válido y se envía
  const onSubmit = async (data) => {
    console.log("Datos recibidos del formulario:", data);
    
    // Aquí es donde Juan conectará con Supabase para guardar el cliente real.
    // Por ahora, simulamos que tarda 1 segundo en guardar y volvemos a la lista.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Al terminar, volvemos a la pantalla de clientes
    navigate('/clientes');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      
      {/* Botón volver y Título */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/clientes"
          className="p-2 rounded-full hover:bg-neutral-200 transition-colors text-neutral-600"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nuevo Cliente</h1>
          <p className="text-neutral-500">Registra un nuevo cliente en el sistema.</p>
        </div>
      </div>

      {/* Componente del Formulario */}
      <ClienteForm onSubmit={onSubmit} isSubmitting={false} />
      
    </div>
  );
}
