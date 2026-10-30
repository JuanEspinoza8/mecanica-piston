import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Loader2, SearchX } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmModal from '../components/ConfirmModal';
import OrdenEncabezado from '../components/orden/OrdenEncabezado';
import TareasOrden from '../components/orden/TareasOrden';
import ArchivosOrden from '../components/orden/ArchivosOrden';
import RepuestosOrden from '../components/orden/RepuestosOrden';
import DeudasOrden from '../components/orden/DeudasOrden';

import { useOrden, useDeleteOrden } from '../hooks/useOrdenes';

export default function OrdenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: orden, isLoading: isLoadingOrden, isError: isErrorOrden } = useOrden(id);
  const { mutateAsync: deleteOrden, isPending: isDeleting } = useDeleteOrden();
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  if (isLoadingOrden) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Cargando detalles de la orden...</p>
      </div>
    );
  }

  // useOrden devuelve null si la orden no existe (o si offline no está en el
  // caché) y tira error si falla la red sin nada cacheado.
  if (!orden) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <SearchX className="w-12 h-12 text-neutral-400 mb-4" />
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          {isErrorOrden ? 'No se pudo cargar la orden' : 'Orden no encontrada'}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
          {isErrorOrden
            ? 'Revisá la conexión y volvé a intentar.'
            : 'Puede que se haya eliminado o que todavía no esté disponible sin conexión.'}
        </p>
        <Link
          to="/ordenes"
          className="flex items-center text-sm font-semibold text-white bg-black dark:bg-red-600 hover:bg-neutral-900 dark:hover:bg-red-700 px-6 py-2.5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a órdenes
        </Link>
      </div>
    );
  }

  const displayId = `ORD-${orden.id.substring(0, 4).toUpperCase()}`;
  const clienteId = orden.cliente?.id;

  const handleDeleteOrden = async () => {
    try {
      await deleteOrden(orden.id);
      toast.success("Orden eliminada exitosamente");
      setConfirmandoBorrado(false);
      navigate('/ordenes');
    } catch {
      toast.error("Error al eliminar la orden");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">

      <OrdenEncabezado orden={orden} displayId={displayId} onEliminar={() => setConfirmandoBorrado(true)} />

      {/* Grid Superior: Info de Cliente y Vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orden.cliente && (
          <Link to={`/clientes/${orden.cliente.id}`} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-red-300 dark:hover:border-red-500 hover:shadow-md transition-all group">
            <div className="flex items-center mb-2 text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wider">
              <User className="w-4 h-4 mr-2" /> Cliente
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
              {orden.cliente.nombre} {orden.cliente.apellido || ''}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400">{orden.cliente.telefono}</p>
          </Link>
        )}

        {orden.vehiculo && (
          <Link to={`/vehiculos/${orden.vehiculo.id}`} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-red-300 dark:hover:border-red-500 hover:shadow-md transition-all group">
            <div className="flex items-center mb-2 text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wider">
              <CarFront className="w-4 h-4 mr-2" /> Vehículo
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
              {orden.vehiculo.marca} {orden.vehiculo.modelo}
            </p>
            <div className="inline-block bg-black dark:bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 tracking-widest">
              {orden.vehiculo.patente}
            </div>
          </Link>
        )}
      </div>

      {/* Grid Principal: Tareas y Repuestos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna Izquierda (Síntoma, Tareas y Archivos) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-red-50/50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
            <div className="flex items-center mb-2 text-red-800 dark:text-red-400 text-sm font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4 mr-2" /> Motivo de Ingreso
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 italic">"{orden.sintoma}"</p>
            {orden.notas && (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 border-t border-red-100 dark:border-red-900/30 pt-2 whitespace-pre-line">
                <span className="font-semibold text-neutral-600 dark:text-neutral-300">Notas: </span> {orden.notas}
              </p>
            )}
          </div>

          <TareasOrden ordenId={orden.id} />
          <ArchivosOrden ordenId={orden.id} />
        </div>

        {/* Columna Derecha (Repuestos y Costos) */}
        <div className="space-y-6">
          <RepuestosOrden orden={orden} clienteId={clienteId} displayId={displayId} />
        </div>

      </div>

      <DeudasOrden ordenId={orden.id} clienteId={clienteId} />

      <ConfirmModal
        isOpen={confirmandoBorrado}
        onClose={() => setConfirmandoBorrado(false)}
        onConfirm={handleDeleteOrden}
        isLoading={isDeleting}
        titulo="¿Eliminar esta orden?"
        mensaje={`Se eliminará permanentemente la orden ${displayId} con sus tareas, repuestos y archivos. Las deudas y los pagos del cliente se conservan, sin vínculo a esta orden. Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, eliminar orden"
      />

    </div>
  );
}
