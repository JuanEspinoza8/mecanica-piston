export const ESTADOS_ORDEN = ['Pendiente', 'En proceso', 'Esperando repuesto', 'Terminado', 'Entregado'];

// Clases de color para el estado de una orden o de una tarea
export function getEstadoBadge(estado) {
  switch (estado) {
    case 'Terminado':
    case 'Entregado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50';
    case 'En proceso': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50';
    case 'Pendiente': return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    case 'Esperando repuesto': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/50';
    default: return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
  }
}
