import { Wrench, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HistorialTimeline({ historial = [] }) {
  if (!historial || historial.length === 0) {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-10 text-center">
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Este vehículo aún no tiene historial de modificaciones.</p>
      </div>
    );
  }

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'reparacion':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      case 'completado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'alerta':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'nota':
      default:
        return <FileText className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getBgColor = (tipo) => {
    switch (tipo) {
      case 'reparacion': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50';
      case 'completado': return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800/50';
      case 'alerta': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50';
      case 'nota':
      default: return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="relative pl-4 sm:pl-6 border-l-2 border-neutral-200 dark:border-neutral-800 ml-4 sm:ml-6 space-y-8 pb-4 mt-6">
      {historial.map((item, index) => (
        <div key={item.id || index} className="relative">
          {/* Timeline Dot/Icon */}
          <div className={`absolute -left-[35px] sm:-left-[43px] w-8 h-8 rounded-full border flex items-center justify-center ${getBgColor(item.tipo)} z-10 ring-4 ring-neutral-50 dark:ring-neutral-950`}>
            {getIcon(item.tipo)}
          </div>

          {/* Content Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm hover:border-red-300 dark:hover:border-red-500/50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
              <h4 className="font-bold text-neutral-900 dark:text-white">{item.titulo}</h4>
              <span className="text-xs font-medium text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded whitespace-nowrap self-start">
                {formatDistanceToNow(new Date(item.fecha), { addSuffix: true, locale: es })}
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.descripcion}</p>
            
            {item.usuario && (
              <p className="text-xs text-neutral-400 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                Registrado por: <span className="font-medium text-neutral-600 dark:text-neutral-300">{item.usuario}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
