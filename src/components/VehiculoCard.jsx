import { Link } from 'react-router-dom';
import { CarFront, Wrench } from 'lucide-react';

export default function VehiculoCard({ vehiculo, variant = 'vertical', ordenesAbiertas = 0 }) {
  const nombreDueño = vehiculo.cliente ? `${vehiculo.cliente.nombre} ${vehiculo.cliente.apellido || ''}`.trim() : 'Desconocido';

  if (variant === 'horizontal') {
    return (
      <Link 
        to={`/vehiculos/${vehiculo.id}`} 
        className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-red-500/50 rounded-2xl p-5 flex items-center transition-all shadow-sm"
      >
        <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl mr-4 group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
          <CarFront className="w-8 h-8 text-neutral-400 dark:text-neutral-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-block bg-black dark:bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded tracking-widest shadow-sm">
              {vehiculo.patente}
            </div>
            {ordenesAbiertas > 0 && (
              <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/50">
                <Wrench className="w-3 h-3" />
                {ordenesAbiertas} {ordenesAbiertas === 1 ? 'orden' : 'órdenes'}
              </span>
            )}
          </div>
          <h4 className="font-bold text-neutral-900 dark:text-white text-lg truncate">{vehiculo.marca} {vehiculo.modelo}</h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{vehiculo.año}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/vehiculos/${vehiculo.id}`}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 hover:border-black dark:hover:border-red-500/50 transition-all group block"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-block bg-black dark:bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-md tracking-widest shadow-sm">
            {vehiculo.patente}
          </div>
          {ordenesAbiertas > 0 && (
            <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/50">
              <Wrench className="w-3 h-3" />
              {ordenesAbiertas}
            </span>
          )}
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-900/30 transition-colors">
          <CarFront className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
        {vehiculo.marca} {vehiculo.modelo}
      </h3>
      
      <div className="flex flex-col space-y-1 text-sm text-neutral-500 dark:text-neutral-400">
        <span>{vehiculo.año}</span>
        <span className="font-medium text-neutral-700 dark:text-neutral-300 mt-2 flex items-center border-t border-neutral-100 dark:border-neutral-800 pt-2">
          <span className="text-neutral-400 dark:text-neutral-500 text-xs uppercase tracking-wide mr-2">Dueño:</span>
          {nombreDueño}
        </span>
      </div>
    </Link>
  );
}
