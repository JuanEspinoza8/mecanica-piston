import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Wrench, Settings, PackageOpen, Plus, Camera, Trash2, FileText, CheckCircle2, Circle, Loader, PauseCircle, X, Save, Loader2, UploadCloud } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import AddRepuestoModal from '../components/AddRepuestoModal';
import ImageViewerModal from '../components/ImageViewerModal';

import { useOrden, useUpdateOrden, useRepuestos, useDeleteRepuesto, useTareas, useAddTarea, useUpdateTarea } from '../hooks/useOrdenes';
import { useArchivos, useFileUpload } from '../hooks/useArchivos';

export default function OrdenDetail() {
  const { id } = useParams();

  // Queries
  const { data: orden, isLoading: isLoadingOrden } = useOrden(id);
  const { data: repuestos = [] } = useRepuestos(id);
  const { data: tareas = [] } = useTareas(id);
  const { data: archivos = [] } = useArchivos(id);

  // Mutations
  const { mutateAsync: updateOrden } = useUpdateOrden();
  const { mutateAsync: deleteRepuesto } = useDeleteRepuesto();
  const { mutateAsync: addTarea } = useAddTarea();
  const { mutateAsync: updateTarea } = useUpdateTarea();
  const { mutateAsync: uploadFile, isPending: isUploading } = useFileUpload();

  // Estados interactivos
  const [isRepuestoModalOpen, setIsRepuestoModalOpen] = useState(false);
  const [manoDeObra, setManoDeObra] = useState('');
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [addingTarea, setAddingTarea] = useState(false);
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSintoma, setEditSintoma] = useState('');
  const [editNotas, setEditNotas] = useState('');

  if (isLoadingOrden || !orden) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Cargando detalles de la orden...</p>
      </div>
    );
  }

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado': 
      case 'Entregado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'En proceso': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Pendiente': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
      case 'Esperando repuesto': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  const handleRemoveRepuesto = async (idToRemove) => {
    if (window.confirm("¿Seguro que deseas eliminar este repuesto?")) {
      try {
        await deleteRepuesto(idToRemove);
        toast.success("Repuesto eliminado");
      } catch (e) {
        toast.error("Error al eliminar repuesto");
      }
    }
  };

  const cicloEstados = ['Pendiente', 'En proceso', 'Terminado'];
  const toggleTarea = async (tarea) => {
    const indexActual = cicloEstados.indexOf(tarea.estado);
    const siguienteEstado = cicloEstados[(indexActual + 1) % cicloEstados.length];
    try {
      await updateTarea({ id: tarea.id, estado: siguienteEstado });
    } catch (e) {
      toast.error("Error al actualizar tarea");
    }
  };

  const tareasTerminadas = tareas.filter(t => t.estado === 'Terminado').length;
  const progresoPorcentaje = tareas.length === 0 ? 0 : Math.round((tareasTerminadas / tareas.length) * 100);

  // Cálculos de Totales
  const totalRepuestos = repuestos.reduce((sum, item) => sum + (Number(item.costo) * Number(item.cantidad)), 0);
  const costoManoDeObra = parseFloat(manoDeObra) || 0;
  const totalEstimado = totalRepuestos + costoManoDeObra;

  // Filtrar fotos
  const fotos = archivos.filter(a => a.tipo === 'imagen');

  const openImageViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleAddTarea = async () => {
    if (nuevaTareaTexto.trim() === '') return;
    try {
      await addTarea({ ordenId: orden.id, descripcion: nuevaTareaTexto.trim() });
      setNuevaTareaTexto('');
      setAddingTarea(false);
    } catch (e) {
      toast.error("Error al agregar tarea");
    }
  };

  const openEditModal = () => {
    setEditSintoma(orden.sintoma || '');
    setEditNotas(orden.notas || '');
    setEditModalOpen(true);
  };

  const handleSaveOrden = async () => {
    try {
      await updateOrden({
        id: orden.id,
        sintoma: editSintoma,
        notas: editNotas,
      });
      toast.success("Orden actualizada");
      setEditModalOpen(false);
    } catch (e) {
      toast.error("Error al actualizar orden");
    }
  };

  const handleEstadoToggle = async () => {
    const newEstado = orden.estado === 'Esperando repuesto' ? 'En proceso' : 'Esperando repuesto';
    try {
      await updateOrden({ id: orden.id, estado: newEstado });
    } catch (e) {
      toast.error("Error al cambiar estado");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tipo = file.type.startsWith('image/') ? 'imagen' : 'documento';
      await uploadFile({ file, ordenId: orden.id, tipo });
      toast.success("Archivo subido correctamente");
    } catch (error) {
      toast.error("Error al subir el archivo");
    }
  };

  const displayId = `ORD-${orden.id.substring(0, 4).toUpperCase()}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera de Navegación y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/ordenes" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{displayId}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getEstadoBadge(orden.estado)}`}>
                {orden.estado}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Ingreso: {orden.fecha_ingreso ? format(new Date(orden.fecha_ingreso), 'dd/MM/yyyy') : '-'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleEstadoToggle}
            className={`flex items-center text-sm font-semibold px-4 py-2.5 rounded-full transition-all border-2 ${
              orden.estado === 'Esperando repuesto'
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 shadow-md'
                : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700'
            }`}
          >
            <PauseCircle className="w-4 h-4 mr-2" />
            {orden.estado === 'Esperando repuesto' ? 'Esperando repuesto ✓' : 'Marcar espera'}
          </button>
          <button 
            onClick={openEditModal}
            className="flex items-center justify-center text-sm font-semibold text-white bg-black dark:bg-red-600 hover:bg-neutral-900 dark:hover:bg-red-700 px-6 py-2.5 rounded-full transition-colors shadow-lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            Editar Orden
          </button>
        </div>
      </div>

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
        
        {/* Columna Izquierda (Tareas y Síntoma) */}
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

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" /> Tareas a Realizar
                </h2>
                <button 
                  onClick={() => setAddingTarea(true)}
                  className="text-sm font-semibold text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Nueva Tarea
                </button>
              </div>
              
              {/* Barra de progreso */}
              {tareas.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-500 ease-out"
                      style={{ width: `${progresoPorcentaje}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {tareasTerminadas} de {tareas.length} ({progresoPorcentaje}%)
                  </span>
                </div>
              )}
            </div>
            
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {tareas.map(tarea => {
                const isDone = tarea.estado === 'Terminado';
                const isInProgress = tarea.estado === 'En proceso';
                return (
                  <div 
                    key={tarea.id} 
                    onClick={() => toggleTarea(tarea)}
                    className={`p-4 flex items-center justify-between transition-colors cursor-pointer select-none
                      ${isDone ? 'bg-green-50/50 dark:bg-green-950/10' : isInProgress ? 'bg-blue-50/30 dark:bg-blue-950/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400 shrink-0" />
                      ) : isInProgress ? (
                        <Loader className="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                      ) : (
                        <Circle className="w-6 h-6 text-neutral-300 dark:text-neutral-600 shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span className={`font-medium transition-all ${isDone ? 'line-through text-neutral-400 dark:text-neutral-600' : 'text-neutral-800 dark:text-neutral-200'}`}>
                          {tarea.descripcion}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          Clic para avanzar estado
                        </span>
                      </div>
                    </div>
                    <span className={`ml-4 px-2 py-1 rounded text-xs font-bold border shrink-0 ${getEstadoBadge(tarea.estado)}`}>
                      {tarea.estado}
                    </span>
                  </div>
                );
              })}
              
              {/* Input inline para nueva tarea */}
              {addingTarea && (
                <div className="p-4 flex items-center gap-3 bg-red-50/30 dark:bg-red-950/10 border-t border-neutral-100 dark:border-neutral-800 animate-in slide-in-from-top-2 duration-200">
                  <Circle className="w-6 h-6 text-neutral-300 dark:text-neutral-600 shrink-0" />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Ej: Cambio de aceite y filtro..."
                    value={nuevaTareaTexto}
                    onChange={(e) => setNuevaTareaTexto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTarea(); if (e.key === 'Escape') { setAddingTarea(false); setNuevaTareaTexto(''); } }}
                    className="flex-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors text-sm"
                  />
                  <button 
                    onClick={handleAddTarea}
                    disabled={!nuevaTareaTexto.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white text-sm font-bold rounded-lg transition-colors shrink-0"
                  >
                    Agregar
                  </button>
                  <button 
                    onClick={() => { setAddingTarea(false); setNuevaTareaTexto(''); }}
                    className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {!addingTarea && tareas.length === 0 && (
                <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                  No hay tareas registradas. Agrega una para comenzar.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
                <Camera className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" /> Archivos y Evidencia
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {fotos.map((foto, index) => (
                <div 
                  key={foto.id} 
                  onClick={() => openImageViewer(index)}
                  className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer group relative"
                >
                  <img src={foto.url} alt={foto.nombre_archivo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold px-2 text-center truncate w-full">{foto.nombre_archivo}</span>
                  </div>
                </div>
              ))}
              
              <label className="aspect-square border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-400 hover:text-red-600 dark:hover:text-red-500 group relative">
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin mb-1 text-red-500" />
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-center px-2">Subir archivo<br/>(Img o PDF)</span>
                  </>
                )}
              </label>
            </div>

            {/* Lista de PDFs */}
            {archivos.filter(a => a.tipo === 'documento').length > 0 && (
              <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Documentos</h3>
                {archivos.filter(a => a.tipo === 'documento').map(doc => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700 group">
                    <FileText className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex-1 truncate">{doc.nombre_archivo}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha (Repuestos y Costos) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-full relative">
            
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                <div className="flex items-center">
                  <PackageOpen className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" /> Repuestos
                </div>
                <span className="bg-black dark:bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{repuestos.length}</span>
              </h2>
            </div>
            
            <div className="flex-1 p-5 space-y-4 max-h-[400px] overflow-y-auto">
              {repuestos.length === 0 ? (
                <div className="text-center p-6 bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                  <PackageOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">No hay repuestos registrados en esta orden.</p>
                </div>
              ) : (
                repuestos.map(rep => (
                  <div key={rep.id} className="group flex justify-between items-start bg-neutral-50 dark:bg-neutral-800/30 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors">
                    <div className="flex-1 pr-3">
                      <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm leading-tight">{rep.nombre}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          {rep.cantidad} x ${(Number(rep.costo) || 0).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-neutral-900 dark:text-white text-sm">
                        ${(rep.cantidad * Number(rep.costo)).toLocaleString('es-AR')}
                      </p>
                      <button 
                        onClick={() => handleRemoveRepuesto(rep.id)}
                        className="text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        title="Eliminar repuesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              <button 
                onClick={() => setIsRepuestoModalOpen(true)}
                className="w-full py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center mt-4"
              >
                <Plus className="w-5 h-5 mr-1" /> Añadir Repuesto
              </button>
            </div>

            {/* Total y Mano de Obra */}
            <div className="p-5 bg-black dark:bg-neutral-950 text-white mt-auto rounded-b-2xl border-t border-neutral-800 space-y-4">
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Subtotal Repuestos</span>
                <span className="font-bold">${totalRepuestos.toLocaleString('es-AR')}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm group">
                <span className="text-neutral-400">Mano de Obra</span>
                <div className="flex items-center">
                  <span className="text-neutral-400 mr-1">$</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={manoDeObra}
                    onChange={(e) => setManoDeObra(e.target.value)}
                    className="w-24 bg-neutral-900 dark:bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-right text-white font-bold focus:outline-none focus:border-red-500 transition-colors appearance-none"
                  />
                </div>
              </div>
              
              <div className="border-t border-neutral-800 pt-4 flex justify-between items-center">
                <span className="font-black text-lg">Total Estimado</span>
                <span className="font-black text-2xl text-red-500 flex items-center">
                  ${totalEstimado.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal interactivo de repuestos */}
      <AddRepuestoModal 
        isOpen={isRepuestoModalOpen}
        onClose={() => setIsRepuestoModalOpen(false)}
        ordenId={orden.id}
      />

      {/* Modal visor de imágenes */}
      <ImageViewerModal 
        isOpen={viewerOpen}
        images={fotos}
        initialIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
      />

      {/* Modal Editar Orden */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                Editar Orden
              </h2>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="p-6 space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Motivo de Ingreso / Síntoma
                </label>
                <textarea
                  value={editSintoma}
                  onChange={(e) => setEditSintoma(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors resize-none text-sm"
                  placeholder="Describe el problema del vehículo..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Notas Internas
                </label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors resize-none text-sm"
                  placeholder="Notas visibles solo para el taller..."
                />
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 rounded-b-2xl">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOrden}
                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-red-600/20"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
