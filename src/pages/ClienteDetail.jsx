import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, CarFront, Calendar, Edit3, Trash2, Loader2, AlertCircle, DollarSign, Plus, X, Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clienteSchema } from '../lib/schemas';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import PagosHistorial from '../components/PagosHistorial';
import PagoForm from '../components/PagoForm';
import EstadoCuenta from '../components/EstadoCuenta';
import VehiculoCard from '../components/VehiculoCard';
import DeudaCard from '../components/DeudaCard';
import CrearDeudaModal from '../components/CrearDeudaModal';
import { useCliente, useDeleteCliente, useUpdateCliente } from '../hooks/useClientes';
import { useVehiculos } from '../hooks/useVehiculos';
import { useDeudas, useDeleteDeuda } from '../hooks/useDeudas';

export default function ClienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isDeudaModalOpen, setIsDeudaModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pagoDeudaId, setPagoDeudaId] = useState(null);
  const [deleteDeudaTarget, setDeleteDeudaTarget] = useState(null);

  const { data: cliente, isLoading, isError } = useCliente(id);
  const { data: vehiculos = [], isLoading: isLoadingVehiculos } = useVehiculos(id);
  const { data: deudas = [] } = useDeudas(id);
  const deleteClienteMutation = useDeleteCliente();
  const { mutateAsync: updateCliente, isPending: isUpdating } = useUpdateCliente();
  const { mutateAsync: deleteDeuda } = useDeleteDeuda();

  const deudasActivas = deudas.filter(d => d.estado !== 'pagada');

  const handleDelete = async () => {
    try {
      await deleteClienteMutation.mutateAsync(id);
      setIsDeleteModalOpen(false);
      toast.success('Cliente eliminado permanentemente');
      navigate('/clientes');
    } catch (error) {
      toast.error('Error al eliminar cliente: ' + error.message);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Cargando información del cliente...</p>
      </div>
    );
  }

  if (isError || !cliente) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl flex flex-col items-center text-center">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p className="font-semibold">Cliente no encontrado</p>
        <Link to="/clientes" className="mt-4 text-sm underline hover:text-red-800">Volver al listado</Link>
      </div>
    );
  }

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
          <button 
            onClick={() => { setPagoDeudaId(null); setIsPagoModalOpen(true); }}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-sm hidden md:flex"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Registrar Pago
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold py-2 px-4 rounded-xl transition-all shadow-sm"
          >
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
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-6">{cliente.nombre} {cliente.apellido || ''}</h2>
        
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
                <p className="font-medium text-neutral-900 dark:text-white">
                  {cliente.created_at ? format(new Date(cliente.created_at), 'dd/MM/yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehículos del Cliente */}
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 mt-8">Vehículos Registrados</h3>
        
        {isLoadingVehiculos ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>
        ) : vehiculos.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Este cliente aún no tiene vehículos registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehiculos.map(vehiculo => (
              <VehiculoCard key={vehiculo.id} vehiculo={vehiculo} variant="horizontal" />
            ))}
          </div>
        )}
      </div>

      {/* Finanzas */}
      <div className="mt-8 space-y-6">
        <EstadoCuenta 
          clienteId={id} 
          onRegistrarPago={() => { setPagoDeudaId(null); setIsPagoModalOpen(true); }}
          onCrearDeuda={() => setIsDeudaModalOpen(true)}
        />

        {/* Deudas del cliente */}
        {deudas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Deudas ({deudasActivas.length} activa{deudasActivas.length !== 1 ? 's' : ''})
              </h3>
              <button
                onClick={() => setIsDeudaModalOpen(true)}
                className="flex items-center text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Deuda
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deudas.map(deuda => (
                <DeudaCard
                  key={deuda.id}
                  deuda={deuda}
                  showOrden
                  onPagar={(d) => { setPagoDeudaId(d.id); setIsPagoModalOpen(true); }}
                  onEliminar={(d) => setDeleteDeudaTarget(d)}
                />
              ))}
            </div>
          </div>
        )}

        <PagosHistorial clienteId={id} />
      </div>

      {/* Modal de Pago */}
      {isPagoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <PagoForm 
            clienteId={id}
            preselectedDeudaId={pagoDeudaId}
            onSuccess={() => setIsPagoModalOpen(false)} 
            onCancel={() => setIsPagoModalOpen(false)} 
          />
        </div>
      )}

      {/* Modal Crear Deuda */}
      <CrearDeudaModal
        isOpen={isDeudaModalOpen}
        onClose={() => setIsDeudaModalOpen(false)}
        clienteId={id}
      />

      {/* Confirmar eliminar deuda */}
      <ConfirmModal
        isOpen={!!deleteDeudaTarget}
        onClose={() => setDeleteDeudaTarget(null)}
        onConfirm={async () => {
          if (deleteDeudaTarget) {
            try {
              await deleteDeuda({ id: deleteDeudaTarget.id, cliente_id: deleteDeudaTarget.cliente_id });
              setDeleteDeudaTarget(null);
            } catch (e) {}
          }
        }}
        titulo="¿Eliminar esta deuda?"
        mensaje={`Se eliminará la deuda "${deleteDeudaTarget?.concepto}" por $${Number(deleteDeudaTarget?.monto_total || 0).toLocaleString('es-AR')}.`}
        textoConfirmar="Sí, eliminar"
      />

      {/* Modal de Confirmación Eliminar Cliente */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteClienteMutation.isPending}
        titulo={`¿Eliminar a ${cliente.nombre}?`}
        mensaje="Esta acción borrará permanentemente el perfil del cliente y desvinculará todos sus vehículos registrados. Esta acción no se puede deshacer."
        textoConfirmar="Sí, eliminar cliente"
      />

      {/* Modal Editar Cliente */}
      {isEditModalOpen && <EditClienteModal
        cliente={cliente}
        onClose={() => setIsEditModalOpen(false)}
        onSave={async (data) => {
          try {
            await updateCliente({ id: cliente.id, ...data });
            toast.success('Cliente actualizado');
            setIsEditModalOpen(false);
          } catch (e) {
            toast.error('Error al actualizar: ' + e.message);
          }
        }}
        isLoading={isUpdating}
      />}

    </div>
  );
}

function EditClienteModal({ cliente, onClose, onSave, isLoading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
    },
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
            <Edit3 className="w-5 h-5 mr-2 text-red-500" /> Editar Cliente
          </h3>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Nombre *</label>
              <input {...register('nombre')} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500 text-neutral-900 dark:text-white" />
              {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Apellido</label>
              <input {...register('apellido')} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500 text-neutral-900 dark:text-white" />
              {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Teléfono *</label>
            <input {...register('telefono')} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500 text-neutral-900 dark:text-white" />
            {errors.telefono && <p className="mt-1 text-xs text-red-500">{errors.telefono.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
            <input {...register('email')} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500 text-neutral-900 dark:text-white" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">Dirección</label>
            <input {...register('direccion')} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-500 text-neutral-900 dark:text-white" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-3 rounded-xl bg-black dark:bg-red-600 hover:bg-neutral-900 dark:hover:bg-red-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg text-sm">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
