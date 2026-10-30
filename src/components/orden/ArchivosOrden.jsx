import { useState } from 'react';
import { Camera, FileText, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import ImageViewerModal from '../ImageViewerModal';
import { useArchivos, useFileUpload } from '../../hooks/useArchivos';

// Fotos y PDF de la orden. Las imágenes se previsualizan antes de subir.
export default function ArchivosOrden({ ordenId }) {
  const { data: archivos = [] } = useArchivos(ordenId);
  const { mutateAsync: uploadFile, isPending: isUploading } = useFileUpload();

  const [viewerIndex, setViewerIndex] = useState(null);
  const [preview, setPreview] = useState(null); // { file, url }

  const fotos = archivos.filter(a => a.tipo === 'imagen');
  const documentos = archivos.filter(a => a.tipo === 'documento');

  const subir = async (file) => {
    try {
      const tipo = file.type.startsWith('image/') ? 'imagen' : 'documento';
      await uploadFile({ file, ordenId, tipo });
      toast.success("Archivo subido correctamente");
    } catch {
      toast.error("Error al subir el archivo");
    }
  };

  const cerrarPreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Si es imagen, mostrar preview; un PDF se sube directamente
    if (file.type.startsWith('image/')) {
      setPreview({ file, url: URL.createObjectURL(file) });
    } else {
      subir(file);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    await subir(preview.file);
    cerrarPreview();
  };

  return (
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
            onClick={() => setViewerIndex(index)}
            className="aspect-square rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 cursor-pointer group relative"
          >
            <img src={foto.url} alt={foto.nombre_archivo} crossOrigin="anonymous" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
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
            onChange={handleFileSelect}
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
      {documentos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Documentos</h3>
          {documentos.map(doc => (
            <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700 group">
              <FileText className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex-1 truncate">{doc.nombre_archivo}</span>
            </a>
          ))}
        </div>
      )}

      {/* Modal visor de imágenes */}
      {viewerIndex !== null && (
        <ImageViewerModal
          images={fotos}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* Modal Preview de Imagen */}
      {preview && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-neutral-900 dark:text-white">Vista previa</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{preview.file.name}</p>
            </div>
            <div className="p-4">
              <img
                src={preview.url}
                alt="Preview"
                className="w-full max-h-[400px] object-contain rounded-xl bg-neutral-100 dark:bg-neutral-800"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
              <button
                onClick={cerrarPreview}
                className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={isUploading}
                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-red-600/20"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Subir Imagen
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
