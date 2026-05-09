import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CarFront, User, Calendar, Wrench, Settings, PackageOpen, Plus, Camera, Trash2, FileText, CheckCircle2, Circle, Loader, PauseCircle, X, Save, Loader2 } from 'lucide-react';
import AddRepuestoModal from '../components/AddRepuestoModal';
import ImageViewerModal from '../components/ImageViewerModal';

export default function OrdenDetail() {
  const { id } = useParams();

  // Mock data para la orden de trabajo (datos estáticos)
  const ordenMock = {
    id: id || 'ORD-001',
    estado: 'En proceso',
    fechaIngreso: '28/04/2026',
    fechaEstimada: '30/04/2026',
    cliente: { id: 1, nombre: 'Juan Pérez', telefono: '+54 11 1234-5678' },
    vehiculo: { id: 101, marca: 'Ford', modelo: 'Fiesta', patente: 'AB 123 CD', año: 2018 },
    sintoma: 'El auto hace un ruido metálico al frenar y vibra el volante.',
    tareasIniciales: [
      { id: 1, descripcion: 'Revisión completa del tren delantero', estado: 'Terminado' },
      { id: 2, descripcion: 'Cambio de pastillas de freno', estado: 'En proceso' },
      { id: 3, descripcion: 'Rectificación de discos', estado: 'Pendiente' },
      { id: 4, descripcion: 'Alineación y balanceo', estado: 'Pendiente' }
    ],
    repuestosIniciales: [
      { id: '1', nombre: 'Juego Pastillas de Freno Motorcraft', cantidad: 1, precio: 45000, archivo: null },
      { id: '2', nombre: 'Líquido de frenos DOT 4', cantidad: 1, precio: 8500, archivo: null }
    ],
    fotos: [
      { id: 1, url: 'https://images.unsplash.com/photo-1486262715619-670810a044e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', titulo: 'Motor al ingresar' },
      { id: 2, url: 'https://images.unsplash.com/photo-1503375497475-4fc14c0a5fa7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', titulo: 'Discos desgastados' }
    ]
  };

  // Estados interactivos
  const [repuestos, setRepuestos] = useState(ordenMock.repuestosIniciales);
  const [isRepuestoModalOpen, setIsRepuestoModalOpen] = useState(false);
  
  const [tareas, setTareas] = useState(ordenMock.tareasIniciales);
  const [manoDeObra, setManoDeObra] = useState('');
  const [esperandoRepuesto, setEsperandoRepuesto] = useState(false);
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Estado para agregar tareas inline
  const [addingTarea, setAddingTarea] = useState(false);
  const [nuevaTareaTexto, setNuevaTareaTexto] = useState('');

  // Estado para el modal de editar orden
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSintoma, setEditSintoma] = useState(ordenMock.sintoma);
  const [editFechaEstimada, setEditFechaEstimada] = useState(ordenMock.fechaEstimada);
  const [editNotas, setEditNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Datos editables de la orden
  const [sintomaActual, setSintomaActual] = useState(ordenMock.sintoma);
  const [fechaEstimadaActual, setFechaEstimadaActual] = useState(ordenMock.fechaEstimada);
  const [notasActual, setNotasActual] = useState('');

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'Terminado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
      case 'En proceso': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Pendiente': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
      case 'Esperando repuesto': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
      default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  // Funciones para manejar repuestos
  const handleAddRepuesto = (nuevoRepuesto) => {
    setRepuestos([...repuestos, nuevoRepuesto]);
  };

  const handleRemoveRepuesto = (idToRemove) => {
    setRepuestos(repuestos.filter(r => r.id !== idToRemove));
  };

  // Funciones para tareas (Checklist) - Ciclo: Pendiente → En proceso → Terminado
  const cicloEstados = ['Pendiente', 'En proceso', 'Terminado'];
  const toggleTarea = (id) => {
    setTareas(tareas.map(t => {
      if (t.id === id) {
        const indexActual = cicloEstados.indexOf(t.estado);
        const siguienteEstado = cicloEstados[(indexActual + 1) % cicloEstados.length];
        return { ...t, estado: siguienteEstado };
      }
      return t;
    }));
  };

  const tareasTerminadas = tareas.filter(t => t.estado === 'Terminado').length;
  const progresoPorcentaje = Math.round((tareasTerminadas / tareas.length) * 100);

  // Estado AUTO-CALCULADO de la orden según progreso de tareas
  const calcularEstadoOrden = () => {
    if (esperandoRepuesto) return 'Esperando repuesto';
    if (tareas.every(t => t.estado === 'Terminado')) return 'Terminado';
    if (tareas.every(t => t.estado === 'Pendiente')) return 'Pendiente';
    return 'En proceso';
  };
  const estadoOrden = calcularEstadoOrden();

  // Cálculos de Totales
  const totalRepuestos = repuestos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const costoManoDeObra = parseFloat(manoDeObra) || 0;
  const totalEstimado = totalRepuestos + costoManoDeObra;

  const openImageViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  // Agregar nueva tarea
  const handleAddTarea = () => {
    if (nuevaTareaTexto.trim() === '') return;
    const newId = Math.max(...tareas.map(t => t.id), 0) + 1;
    setTareas([...tareas, { id: newId, descripcion: nuevaTareaTexto.trim(), estado: 'Pendiente' }]);
    setNuevaTareaTexto('');
    setAddingTarea(false);
  };

  // Abrir modal de editar con datos actuales
  const openEditModal = () => {
    setEditSintoma(sintomaActual);
    setEditFechaEstimada(fechaEstimadaActual);
    setEditNotas(notasActual);
    setEditModalOpen(true);
  };

  // Guardar cambios de editar orden (protegido contra doble submit)
  const handleSaveOrden = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Simular guardado en servidor (Juan conectará a Supabase)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSintomaActual(editSintoma);
      setFechaEstimadaActual(editFechaEstimada);
      setNotasActual(editNotas);
      setEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      
      {/* Cabecera de Navegación y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/ordenes" className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{ordenMock.id}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getEstadoBadge(estadoOrden)}`}>
                {estadoOrden}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setEsperandoRepuesto(!esperandoRepuesto)}
            className={`flex items-center text-sm font-semibold px-4 py-2.5 rounded-full transition-all border-2 ${
              esperandoRepuesto
                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 shadow-md'
                : 'bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-orange-300 dark:hover:border-orange-700'
            }`}
          >
            <PauseCircle className="w-4 h-4 mr-2" />
            {esperandoRepuesto ? 'Esperando repuesto ✓' : 'Marcar espera'}
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
        <Link to={`/clientes/${ordenMock.cliente.id}`} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-red-300 dark:hover:border-red-500 hover:shadow-md transition-all group">
          <div className="flex items-center mb-2 text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wider">
            <User className="w-4 h-4 mr-2" /> Cliente
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">{ordenMock.cliente.nombre}</p>
          <p className="text-neutral-500 dark:text-neutral-400">{ordenMock.cliente.telefono}</p>
        </Link>
        
        <Link to={`/vehiculos/${ordenMock.vehiculo.id}`} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-red-300 dark:hover:border-red-500 hover:shadow-md transition-all group">
          <div className="flex items-center mb-2 text-neutral-500 dark:text-neutral-400 text-sm font-semibold uppercase tracking-wider">
            <CarFront className="w-4 h-4 mr-2" /> Vehículo
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
            {ordenMock.vehiculo.marca} {ordenMock.vehiculo.modelo}
          </p>
          <div className="inline-block bg-black dark:bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 tracking-widest">
            {ordenMock.vehiculo.patente}
          </div>
        </Link>
      </div>

      {/* Grid Principal: Tareas y Repuestos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (Tareas y Síntoma) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-red-50/50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
            <div className="flex items-center mb-2 text-red-800 dark:text-red-400 text-sm font-semibold uppercase tracking-wider">
              <Calendar className="w-4 h-4 mr-2" /> Motivo de Ingreso
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 italic">"{sintomaActual}"</p>
            {notasActual && (
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2 border-t border-red-100 dark:border-red-900/30 pt-2">
                <span className="font-semibold text-neutral-600 dark:text-neutral-300">Notas:</span> {notasActual}
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
            </div>
            
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {tareas.map(tarea => {
                const isDone = tarea.estado === 'Terminado';
                const isInProgress = tarea.estado === 'En proceso';
                return (
                  <div 
                    key={tarea.id} 
                    onClick={() => toggleTarea(tarea.id)}
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
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center">
                <Camera className="w-5 h-5 mr-2 text-neutral-500 dark:text-neutral-400" /> Evidencia Fotográfica
              </h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ordenMock.fotos.map((foto, index) => (
                <div 
                  key={foto.id} 
                  onClick={() => openImageViewer(index)}
                  className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer group relative"
                >
                  <img src={foto.url} alt={foto.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold px-2 text-center">{foto.titulo}</span>
                  </div>
                </div>
              ))}
              <div className="aspect-square border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-400 hover:text-red-600 dark:hover:text-red-500 group">
                <Plus className="w-8 h-8 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Subir foto</span>
              </div>
            </div>
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
                          {rep.cantidad} x ${rep.precio.toLocaleString('es-AR')}
                        </span>
                        {rep.archivo && (
                          <div className="flex items-center ml-2 pl-2 border-l border-neutral-200 dark:border-neutral-700 text-xs text-blue-600 dark:text-blue-400 font-medium">
                            <FileText className="w-3 h-3 mr-1" />
                            Factura
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-neutral-900 dark:text-white text-sm">
                        ${(rep.cantidad * rep.precio).toLocaleString('es-AR')}
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
        onAdd={handleAddRepuesto}
      />

      {/* Modal visor de imágenes */}
      <ImageViewerModal 
        isOpen={viewerOpen}
        images={ordenMock.fotos}
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
                  Fecha Estimada de Entrega
                </label>
                <input
                  type="text"
                  value={editFechaEstimada}
                  onChange={(e) => setEditFechaEstimada(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors text-sm"
                  placeholder="Ej: 02/05/2026"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Notas Internas
                </label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-neutral-800 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors resize-none text-sm"
                  placeholder="Notas visibles solo para el taller..."
                />
              </div>
            </div>

            {/* Footer del modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 rounded-b-2xl">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOrden}
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-70 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-red-600/20"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
