import Dexie from 'dexie';

/**
 * Base de datos IndexedDB para Mecánica Pistón.
 * Tablas espejo de Supabase para cache offline.
 *
 * Convención: los campos indexados (&id) son primary keys.
 * Los campos adicionales son índices secundarios para queries offline.
 */
const db = new Dexie('MecanicaPistonDB');

db.version(3).stores({
  // Tablas espejo de Supabase
  clientes: '&id, nombre, apellido, telefono',
  vehiculos: '&id, cliente_id, patente, marca',
  ordenes_trabajo: '&id, vehiculo_id, estado',
  repuestos: '&id, orden_id',
  tareas_orden: '&id, orden_id',
  pagos: '&id, cliente_id',
  deudas: '&id, cliente_id, orden_id, estado',
  notas: '&id, completada',
  historial_modificaciones: '&id, vehiculo_id',
  archivos: '&id, orden_id',

  // Cola de operaciones pendientes de sincronización
  // ++id = autoincrement para mantener orden FIFO
  pending_sync: '++id, tabla, operacion, timestamp',
});

// v4:
// - pagos.orden_id: sin este índice, borrar una orden offline tiraba un
//   SchemaError al buscar sus pagos y quedaban pagos huérfanos en el caché.
//   pagos.deuda_id: para desvincular los pagos al borrar una deuda offline.
// - pending_sync.estado: separa lo que falta sincronizar ('pendiente') de lo
//   que falló de forma permanente ('error') y espera una decisión del usuario.
db.version(4).stores({
  pagos: '&id, cliente_id, orden_id, deuda_id',
  pending_sync: '++id, tabla, operacion, timestamp, estado',
}).upgrade(tx => tx.table('pending_sync').toCollection().modify(op => {
  op.estado = 'pendiente';
  op.intentos = 0;
  op.proximoIntento = 0;
}));

export default db;
