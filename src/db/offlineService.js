import db from './database';
import { supabase } from '../lib/supabase';

/**
 * Servicio de sincronización offline para Mecánica Pistón.
 * 
 * Funciones principales:
 * - cacheData(): guarda datos de Supabase en IndexedDB
 * - getCachedData(): lee datos desde IndexedDB
 * - addPendingSync(): encola una operación para sincronizar después
 * - processPendingSyncs(): procesa la cola FIFO contra Supabase
 */

// =============================================================================
// CACHE: Guardar y leer datos de IndexedDB
// =============================================================================

/**
 * Guarda un array de registros en la tabla IndexedDB correspondiente.
 * Usa bulkPut para upsert (insertar o actualizar por id).
 */
export async function cacheData(tabla, datos) {
  try {
    if (!datos || !Array.isArray(datos) || datos.length === 0) return;
    await db[tabla].bulkPut(datos);
  } catch (error) {
    console.warn(`[Offline] Error cacheando ${tabla}:`, error);
  }
}

/**
 * Guarda un solo registro en IndexedDB.
 */
export async function cacheOne(tabla, dato) {
  try {
    if (!dato) return;
    await db[tabla].put(dato);
  } catch (error) {
    console.warn(`[Offline] Error cacheando registro en ${tabla}:`, error);
  }
}

/**
 * Lee todos los registros de una tabla en IndexedDB.
 */
export async function getCachedData(tabla) {
  try {
    return await db[tabla].toArray();
  } catch (error) {
    console.warn(`[Offline] Error leyendo cache de ${tabla}:`, error);
    return [];
  }
}

/**
 * Lee un registro por ID desde IndexedDB.
 */
export async function getCachedById(tabla, id) {
  try {
    return await db[tabla].get(id);
  } catch (error) {
    console.warn(`[Offline] Error leyendo ${tabla}/${id}:`, error);
    return null;
  }
}

/**
 * Lee registros filtrados por un campo índice.
 */
export async function getCachedByIndex(tabla, campo, valor) {
  try {
    return await db[tabla].where(campo).equals(valor).toArray();
  } catch (error) {
    console.warn(`[Offline] Error filtrando ${tabla} por ${campo}:`, error);
    return [];
  }
}

/**
 * Elimina un registro de la cache local.
 */
export async function removeCached(tabla, id) {
  try {
    await db[tabla].delete(id);
  } catch (error) {
    console.warn(`[Offline] Error eliminando de cache ${tabla}/${id}:`, error);
  }
}

/**
 * Borra en cascada registros asociados en la caché local (IndexedDB).
 * No agrega operaciones a pending_sync (Supabase ya tiene ON DELETE CASCADE o los hooks se encargan de agregar el padre).
 */
export async function offlineCascadeDelete(tabla, id) {
  try {
    if (tabla === 'clientes') {
      const vehiculos = await getCachedByIndex('vehiculos', 'cliente_id', id);
      for (const v of vehiculos) await offlineCascadeDelete('vehiculos', v.id);
      
      const deudas = await getCachedByIndex('deudas', 'cliente_id', id);
      for (const d of deudas) await offlineCascadeDelete('deudas', d.id);
      
      const pagos = await getCachedByIndex('pagos', 'cliente_id', id);
      for (const p of pagos) await offlineCascadeDelete('pagos', p.id);
    } 
    else if (tabla === 'vehiculos') {
      const ordenes = await getCachedByIndex('ordenes_trabajo', 'vehiculo_id', id);
      for (const o of ordenes) await offlineCascadeDelete('ordenes_trabajo', o.id);
    }
    else if (tabla === 'ordenes_trabajo') {
      const deudas = await getCachedByIndex('deudas', 'orden_id', id);
      for (const d of deudas) await offlineCascadeDelete('deudas', d.id);
      
      const pagos = await getCachedByIndex('pagos', 'orden_id', id);
      for (const p of pagos) await offlineCascadeDelete('pagos', p.id);
      
      const tareas = await getCachedByIndex('tareas_orden', 'orden_id', id);
      for (const t of tareas) await offlineCascadeDelete('tareas_orden', t.id);
      
      const repuestos = await getCachedByIndex('repuestos', 'orden_id', id);
      for (const r of repuestos) await offlineCascadeDelete('repuestos', r.id);
      
      const archivos = await getCachedByIndex('archivos', 'orden_id', id);
      for (const a of archivos) await offlineCascadeDelete('archivos', a.id);
    }

    await removeCached(tabla, id);
  } catch (error) {
    console.error(`[Offline Cascade Delete] Error borrando ${tabla}/${id}:`, error);
  }
}

// =============================================================================
// PENDING SYNC: Cola de operaciones offline
// =============================================================================

/**
 * Agrega una operación a la cola de pendientes.
 * @param {string} tabla - Nombre de la tabla Supabase (ej: 'clientes')
 * @param {'insert'|'update'|'delete'} operacion - Tipo de operación
 * @param {object} datos - Datos de la operación
 */
export async function addPendingSync(tabla, operacion, datos) {
  try {
    await db.pending_sync.add({
      tabla,
      operacion,
      datos,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Offline] Error agregando pendiente:', error);
  }
}

/**
 * Obtiene todas las operaciones pendientes en orden FIFO.
 */
export async function getPendingSyncs() {
  try {
    return await db.pending_sync.orderBy('id').toArray();
  } catch (error) {
    console.error('[Offline] Error leyendo pendientes:', error);
    return [];
  }
}

/**
 * Cuenta las operaciones pendientes.
 */
export async function getPendingCount() {
  try {
    return await db.pending_sync.count();
  } catch (error) {
    return 0;
  }
}

/**
 * Procesa todas las operaciones pendientes contra Supabase.
 * Ejecuta en orden FIFO. Si una falla, se detiene y deja las restantes.
 * 
 * @returns {{ processed: number, failed: boolean, error?: string }}
 */
export async function processPendingSyncs() {
  const pendientes = await getPendingSyncs();
  if (pendientes.length === 0) return { processed: 0, failed: false };

  let processed = 0;

  for (const item of pendientes) {
    try {
      await executeSyncOperation(item);
      // Eliminar de la cola tras éxito
      await db.pending_sync.delete(item.id);
      processed++;
    } catch (error) {
      console.error(`[Sync] Error procesando operación #${item.id}:`, error);
      return { processed, failed: true, error: error.message };
    }
  }

  return { processed, failed: false };
}

/**
 * Ejecuta una operación individual contra Supabase.
 */
async function executeSyncOperation(item) {
  const { tabla, operacion, datos } = item;

  switch (operacion) {
    case 'insert': {
      const { error } = await supabase.from(tabla).insert([datos]);
      if (error) throw error;
      break;
    }
    case 'update': {
      const { id, ...updateData } = datos;
      const { error } = await supabase.from(tabla).update(updateData).eq('id', id);
      if (error) throw error;
      break;
    }
    case 'delete': {
      if (tabla === 'ordenes_trabajo') {
        await supabase.from('deudas').delete().eq('orden_id', datos.id);
        await supabase.from('pagos').delete().eq('orden_id', datos.id);
        await supabase.from('tareas_orden').delete().eq('orden_id', datos.id);
        await supabase.from('repuestos').delete().eq('orden_id', datos.id);
        await supabase.from('archivos').delete().eq('orden_id', datos.id);
      }
      
      const { error } = await supabase.from(tabla).delete().eq('id', datos.id);
      if (error) throw error;
      break;
    }
    default:
      console.warn(`[Sync] Operación desconocida: ${operacion}`);
  }
}

// =============================================================================
// UTILIDADES
// =============================================================================

/** Chequea si hay conexión a internet */
export function isOnline() {
  return navigator.onLine;
}

/** Genera un ID seguro para uso offline (fallback si no hay crypto) */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para entornos HTTP locales (no HTTPS)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
