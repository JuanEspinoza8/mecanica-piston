import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// Se monta solo mientras está abierto, así el índice arranca en la imagen elegida
export default function ImageViewerModal({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const total = images?.length || 0;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  // Manejo de teclado (Esc para cerrar, Flechas para navegar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  if (total === 0) return null;
  // Por si la lista cambia mientras el visor está abierto
  const imagen = images[Math.min(currentIndex, total - 1)];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Botón Cerrar */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navegación Izquierda */}
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Contenedor de la Imagen */}
      <div 
        className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer clic en la imagen
      >
        <img 
          src={imagen.url} crossOrigin="anonymous" 
          alt={imagen.titulo || 'Evidencia fotográfica'} 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        {imagen.titulo && (
          <p className="absolute bottom-[-40px] text-white text-lg font-medium text-center w-full">
            {imagen.titulo}
          </p>
        )}
      </div>

      {/* Navegación Derecha */}
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
      
      {/* Indicador (Ej: 1 / 4) */}
      {images.length > 1 && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/70 font-semibold tracking-widest text-sm bg-black/40 px-4 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      )}

    </div>
  );
}
