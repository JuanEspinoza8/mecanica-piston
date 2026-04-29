import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Mail, CarFront, Plus, Settings } from 'lucide-react';

export default function ClienteDetail() {
  const { id } = useParams();

  // Datos simulados (mock) del cliente específico
  const cliente = {
    id: id,
    nombre: 'Juan Pérez',
    telefono: '+54 11 1234-5678',
    email: 'juan.perez@email.com',
    direccion: 'Av. San Martín 1234, CABA',
    fechaRegistro: '15/10/2023',
  };

  // Datos simulados (mock) de los vehículos de este cliente
  const vehiculos = [
    { id: 101, patente: 'AB 123 CD', marca: 'Ford', modelo: 'Fiesta', año: 2018, color: 'Blanco' },
    { id: 102, patente: 'AA 000 BB', marca: 'Toyota', modelo: 'Hilux', año: 2016, color: 'Gris' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Botón volver y Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/clientes"
            className="p-2 rounded-full hover:bg-neutral-200 transition-colors text-neutral-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Detalle del Cliente</h1>
        </div>
        
        {/* Botón para editar cliente (para el futuro) */}
        <button className="flex items-center text-sm font-medium text-neutral-500 hover:text-black transition-colors bg-white border border-neutral-200 px-4 py-2 rounded-full shadow-sm hover:shadow">
          <Settings className="w-4 h-4 mr-2" />
          Editar
        </button>
      </div>

      {/* Tarjeta de Información del Cliente */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
        {/* Decoración visual de fondo */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Avatar grande */}
        <div className="bg-neutral-100 p-6 rounded-full shrink-0">
          <User className="w-12 h-12 text-neutral-400" />
        </div>
        
        {/* Datos */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{cliente.nombre}</h2>
            <p className="text-sm text-neutral-400">Cliente desde {cliente.fechaRegistro}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <Phone className="w-4 h-4 mr-3 text-red-500 shrink-0" />
              <span className="font-medium truncate">{cliente.telefono}</span>
            </div>
            {cliente.email && (
              <div className="flex items-center text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <Mail className="w-4 h-4 mr-3 text-red-500 shrink-0" />
                <span className="font-medium truncate">{cliente.email}</span>
              </div>
            )}
            {cliente.direccion && (
              <div className="flex items-center text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <MapPin className="w-4 h-4 mr-3 text-red-500 shrink-0" />
                <span className="font-medium truncate">{cliente.direccion}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-neutral-200" />

      {/* Sección de Vehículos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-900 flex items-center">
            <CarFront className="w-5 h-5 mr-2 text-neutral-500" />
            Vehículos ({vehiculos.length})
          </h3>
          
          <Link 
            to="/vehiculos/nuevo" 
            className="flex items-center text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar Vehículo
          </Link>
        </div>

        {/* Grilla de Vehículos */}
        {vehiculos.length === 0 ? (
           <div className="bg-neutral-50 border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
             <CarFront className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
             <p className="text-neutral-500 font-medium">Este cliente no tiene vehículos registrados.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehiculos.map(vehiculo => (
              <Link 
                key={vehiculo.id}
                to={`/vehiculos/${vehiculo.id}`}
                className="bg-white border border-neutral-200 rounded-2xl p-5 hover:border-black hover:shadow-md transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-md tracking-widest mb-2 shadow-sm">
                    {vehiculo.patente}
                  </div>
                  <h4 className="text-lg font-bold text-neutral-900 group-hover:text-red-600 transition-colors">
                    {vehiculo.marca} {vehiculo.modelo}
                  </h4>
                  <p className="text-sm text-neutral-500">{vehiculo.año} • Color {vehiculo.color}</p>
                </div>
                <div className="bg-neutral-100 p-3 rounded-full group-hover:bg-red-50 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-red-600 rotate-180 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
