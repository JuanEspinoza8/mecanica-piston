import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, CarFront, Calendar, Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';

export default function ClienteDetail() {
  const { id } = useParams();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Mock data por ahora
  const cliente = {
    id: id || '1',
    nombre: 'Juan Pérez',
    telefono: '11 1234-5678',
    email: 'juan.perez@email.com',
    direccion: 'Av. Corrientes 1234, CABA',
    fechaAlta: '15/03/2025'
  };

  const vehiculos = [
    { id: '101', patente: 'AB 123 CD', marca: 'Ford', modelo: 'Fiesta', año: 2018 },
    { id: '102', patente: 'AA 000 BB', marca: 'Toyota', modelo: 'Hilux', año: 2016 },
  ];

  const handleDelete = () => {
    console.log("Eliminando cliente...");
    setIsDeleteModalOpen(false);
    // Aquí iría la redirección después de borrar
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/clientes" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Perfil del Cliente</h1>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold py-2 px-4 rounded-xl transition-all shadow-sm">
            <Edit3 className="w-4 h-4 mr-2" />
            Editar
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center bg-white dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 font-semibold py-2 px-4 rounded-xl transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Tarjeta Principal de Información */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-6">{cliente.nombre}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-neutral-400 dark:text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Teléfono</p>
                <p className="font-medium text-neutral-900 dark:text-white">{cliente.telefono}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-neutral-400 dark:text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Email</p>
                <p className="font-medium text-neutral-900 dark:text-white">{cliente.email}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-neutral-400 dark:text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Dirección</p>
                <p className="font-medium text-neutral-900 dark:text-white">{cliente.direccion}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-neutral-400 dark:text-red-500 mr-3 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Cliente desde</p>
                <p className="font-medium text-neutral-900 dark:text-white">{cliente.fechaAlta}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehículos del Cliente */}
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 mt-8">Vehículos Registrados</h3>
        
        {vehiculos.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Este cliente aún no tiene vehículos registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehiculos.map(vehiculo => (
              <Link key={vehiculo.id} to={`/vehiculos/${vehiculo.id}`} className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-red-500/50 rounded-2xl p-5 flex items-center transition-all shadow-sm">
                <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl mr-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
                  <CarFront className="w-8 h-8 text-neutral-400 dark:text-neutral-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                </div>
                <div>
                  <div className="inline-block bg-black dark:bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded tracking-widest mb-1 shadow-sm">
                    {vehiculo.patente}
                  </div>
                  <h4 className="font-bold text-neutral-900 dark:text-white text-lg">{vehiculo.marca} {vehiculo.modelo}</h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{vehiculo.año}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmación Demo */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        titulo="¿Eliminar a Juan Pérez?"
        mensaje="Esta acción borrará permanentemente el perfil del cliente y desvinculará todos sus vehículos registrados. Esta acción no se puede deshacer."
        textoConfirmar="Sí, eliminar cliente"
      />

    </div>
  );
}
