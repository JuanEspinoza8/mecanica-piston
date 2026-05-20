import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Palette, Hash, ClipboardList, Plus, ChevronRight, Loader2, Trash2, History, DollarSign, Camera, FileText, Download, Edit3, X } from 'lucide-react';
import { useVehiculo, useDeleteVehiculo, useUpdateVehiculo } from '../hooks/useVehiculos';
import { useOrdenes } from '../hooks/useOrdenes';
import { useHistorialModificaciones } from '../hooks/useHistorial';
import { useDeudasVehiculo } from '../hooks/useDeudas';
import { useArchivosVehiculo } from '../hooks/useArchivos';
import ConfirmModal from '../components/ConfirmModal';
import HistorialTimeline from '../components/HistorialTimeline';
import DeudaCard from '../components/DeudaCard';
import ImageViewerModal from '../components/ImageViewerModal';
import VehiculoForm from '../components/VehiculoForm';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VehiculoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: vehiculo, isLoading, isError } = useVehiculo(id);
  const { mutateAsync: deleteVehiculo, isPending: isDeleting } = useDeleteVehiculo();
  const { mutateAsync: updateVehiculo, isPending: isUpdating } = useUpdateVehiculo();
  const { data: deudasVehiculo = [] } = useDeudasVehiculo(id);
  const { data: archivosVehiculo = [] } = useArchivosVehiculo(id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleDelete = async () => {
    try {
      await deleteVehiculo(id);
      toast.success('Vehículo eliminado correctamente');
      navigate('/vehiculos');
    } catch (error) {
      toast.error('Error al eliminar el vehículo');
    }
  };

  // Traer las órdenes reales del vehículo
  const { data: ordenesData = [], isLoading: isLoadingOrdenes } = useOrdenes(id);

  // Historial de modificaciones
  const { data: historial = [], isLoading: isLoadingHistorial } = useHistorialModificaciones(id);

  // Mapear los datos de BD al formato esperado por la UI
  const ordenes = ordenesData.map(orden => ({
    id: orden.id,
    displayId: `ORD-${orden.id.substring(0, 4).toUpperCase()}`,
    fecha: orden.fecha_ingreso ? format(new Date(orden.fecha_ingreso), 'dd/MM/yyyy') : '-',
    estado: orden.estado,
    total: `$${(orden.totalRepuestos || 0).toLocaleString('es-AR')}`
  }));

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'En proceso': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-neutral-400" /></div>;
  }
  
  if (isError || !vehiculo) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Vehículo no encontrado</h2>
        <Link to="/vehiculos" className="text-red-500 hover:underline">Volver a la lista</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/vehiculos" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Perfil del Vehículo</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-semibold py-2 px-4 rounded-xl transition-all shadow-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Editar
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Eliminar Vehículo"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tarjeta Principal del Vehículo */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-neutral-900/5 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          
          <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-2xl shrink-0 text-center z-10 relative">
            <CarFront className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mx-auto mb-2" />
            <div className="inline-block bg-black dark:bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-md tracking-widest shadow-sm">
              {vehiculo.patente}
            </div>
          </div>
          
          <div className="flex-1 space-y-4 w-full z-10 relative">
            <div>
              <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{vehiculo.marca} {vehiculo.modelo}</h2>
              {vehiculo.cliente && (
                <Link to={`/clientes/${vehiculo.cliente.id}`} className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mt-1">
                  <User className="w-4 h-4 mr-1" /> Propiedad de {vehiculo.cliente.nombre} {vehiculo.cliente.apellido || ''}
                </Link>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-4">
              <div>
                <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Año</p>
                <p className="font-bold text-neutral-800 dark:text-neutral-200">{vehiculo.año}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Historial de Órdenes */}
      <div>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
            Historial de Reparaciones
          </h3>
          <Link to="/ordenes/nueva" className="text-sm font-semibold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4 mr-1" /> Nueva Orden
          </Link>
        </div>

        {ordenes.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-10 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">Este vehículo aún no tiene historial en el taller.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ordenes.map(orden => (
                <Link key={orden.id} to={`/ordenes/${orden.id}`} className="group flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-3 text-center min-w-[80px]">
                      <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase">{orden.fecha !== '-' ? orden.fecha.split('/')[1] : '-'}</p>
                      <p className="text-lg font-black text-neutral-900 dark:text-white">{orden.fecha !== '-' ? orden.fecha.split('/')[0] : '-'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white group-hover:text-red-500 transition-colors">{orden.displayId}</h4>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold border uppercase ${getEstadoBadge(orden.estado)}`}>
                        {orden.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-neutral-900 dark:text-white">{orden.total}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-red-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fotos y Archivos del vehículo */}
      {archivosVehiculo.length > 0 && (() => {
        const fotos = archivosVehiculo.filter(a => a.tipo === 'imagen');
        const documentos = archivosVehiculo.filter(a => a.tipo !== 'imagen');
        return (
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-4 mt-8">
              <Camera className="w-5 h-5 mr-2 text-neutral-500" />
              Fotos y Archivos
            </h3>

            {/* Galería de fotos */}
            {fotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                {fotos.map((foto, idx) => (
                  <div
                    key={foto.id}
                    onClick={() => { setViewerIndex(idx); setViewerOpen(true); }}
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-neutral-200 dark:border-neutral-800 hover:border-red-400 transition-all hover:shadow-md group relative"
                  >
                    <img src={foto.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full">
                      {foto.displayOrdenId}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Documentos */}
            {documentos.length > 0 && (
              <div className="space-y-2">
                {documentos.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-red-400 transition-all text-sm group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">{doc.nombre_original || 'Documento'}</span>
                      <span className="text-[10px] text-neutral-400 shrink-0">{doc.displayOrdenId}</span>
                    </div>
                    <Download className="w-4 h-4 text-neutral-400 group-hover:text-red-500 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Image viewer modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        images={archivosVehiculo.filter(a => a.tipo === 'imagen')}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />

      {/* Deudas asociadas a órdenes de este vehículo */}
      {deudasVehiculo.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-4 mt-8">
            <DollarSign className="w-5 h-5 mr-2 text-neutral-500" />
            Deudas Asociadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deudasVehiculo.map(deuda => (
              <DeudaCard key={deuda.id} deuda={deuda} />
            ))}
          </div>
        </div>
      )}

      {/* Historial de Modificaciones */}
      <div>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
            Historial de Modificaciones
          </h3>
        </div>
        {isLoadingHistorial ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <HistorialTimeline historial={historial} />
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        titulo="Eliminar Vehículo"
        mensaje={`¿Estás seguro que querés eliminar el vehículo ${vehiculo.patente}? Esta acción no se puede deshacer y borrará todo su historial.`}
        isLoading={isDeleting}
      />

      {/* Modal Editar Vehículo */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
                <Edit3 className="w-5 h-5 mr-2 text-red-500" /> Editar Vehículo
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <VehiculoForm
                hideClienteField
                defaultValues={{
                  patente: vehiculo.patente || '',
                  marca: vehiculo.marca || '',
                  modelo: vehiculo.modelo || '',
                  año: vehiculo.año || new Date().getFullYear(),
                  color: vehiculo.color || '',
                  clienteId: vehiculo.cliente?.id || vehiculo.cliente_id || '',
                }}
                onSubmit={async (data) => {
                  try {
                    await updateVehiculo({ id: vehiculo.id, ...data, clienteId: vehiculo.cliente?.id || vehiculo.cliente_id });
                    toast.success('Vehículo actualizado');
                    setIsEditModalOpen(false);
                  } catch (e) {
                    toast.error('Error al actualizar: ' + e.message);
                  }
                }}
                isSubmitting={isUpdating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
