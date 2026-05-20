import Dexie from 'dexie';

/**
 * Base de datos IndexedDB para Mecánica Pistón.
 * Tablas espejo de Supabase para cache offline.
 * 
 * Convención: los campos indexados (&id) son primary keys.
 * Los campos adicionales son índices secundarios para queries offline.
 */
const db = new Dexie('MecanicaPistonDB');

db.version(2).stores({
  // Tablas espejo de Supabase
  clientes: '&id, nombre, apellido, telefono',
  vehiculos: '&id, cliente_id, patente, marca',
  ordenes_trabajo: '&id, vehiculo_id, estado',
  repuestos: '&id, orden_id',
  pagos: '&id, cliente_id',
  deudas: '&id, cliente_id, orden_id, estado',
  notas: '&id, completada',
  historial_modificaciones: '&id, vehiculo_id',
  archivos: '&id, orden_id',

  // Cola de operaciones pendientes de sincronización
  // ++id = autoincrement para mantener orden FIFO
  pending_sync: '++id, tabla, operacion, timestamp',
});

export default db;
