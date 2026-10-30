import db from './database';
import { supabase } from '../lib/supabase';

/**
 * Servicio de sincronización offline para Mecánica Pistón.
 *
 * Funciones principales:
 * - cacheData(): guarda datos de Supabase en IndexedDB
 * - getCachedData(): lee datos desde IndexedDB
 * - addPendingSync(): encola una operación para sincronizar después
 * - processPendingSyncs(): procesa la cola FIFO contra Supabase, con reintentos
 * - getSyncErrors() / retrySyncError() / discardSyncError(): bandeja de errores
 */

// Reintentos: espera exponencial (2 s, 4 s, 8 s...) con un máximo de 5 minutos.
// Los errores del servidor (5xx, timeouts) se reintentan hasta MAX_INTENTOS y
// después pasan a la bandeja. Los errores de red no cuentan como intento: sin
// conexión real no tiene sentido rendirse.
export const MAX_INTENTOS = 6;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MAX_MS = 5 * 60 * 1000;

export function backoffMs(intentos) {
  return Math.min(BACKOFF_BASE_MS * 2 ** (intentos - 1), BACKOFF_MAX_MS);
}

// Avisos de cambios en la cola (para actualizar contadores en la UI sin que
// cada hook tenga que hacerlo a mano). El motivo es 'nueva' cuando hay algo
// nuevo para mandar (una operación encolada o reintentada) y 'actualizada' en
// el resto de los casos.
const queueListeners = new Set();

export function subscribeQueue(listener) {
  queueListeners.add(listener);
  return () => queueListeners.delete(listener);
}

function notifyQueueChange(motivo = 'actualizada') {
  queueListeners.forEach(listener => listener(motivo));
}

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
 * Replica en la caché local (IndexedDB) lo que hacen las foreign keys de
 * Postgres al borrar un registro: CASCADE borra los hijos y SET NULL los
 * desvincula. No encola nada: en el servidor lo resuelven las foreign keys.
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

      const historial = await getCachedByIndex('historial_modificaciones', 'vehiculo_id', id);
      for (const h of historial) await removeCached('historial_modificaciones', h.id);
    }
    else if (tabla === 'ordenes_trabajo') {
      // Igual que en Postgres (ON DELETE SET NULL): las deudas y los pagos
      // del cliente se conservan, solo pierden el vínculo con la orden.
      const deudas = await getCachedByIndex('deudas', 'orden_id', id);
      for (const d of deudas) await cacheOne('deudas', { ...d, orden_id: null, ordenes_trabajo: null });

      const pagos = await getCachedByIndex('pagos', 'orden_id', id);
      for (const p of pagos) await cacheOne('pagos', { ...p, orden_id: null });

      const tareas = await getCachedByIndex('tareas_orden', 'orden_id', id);
      for (const t of tareas) await offlineCascadeDelete('tareas_orden', t.id);

      const repuestos = await getCachedByIndex('repuestos', 'orden_id', id);
      for (const r of repuestos) await offlineCascadeDelete('repuestos', r.id);

      const archivos = await getCachedByIndex('archivos', 'orden_id', id);
      for (const a of archivos) await offlineCascadeDelete('archivos', a.id);
    }
    else if (tabla === 'deudas') {
      // pagos.deuda_id es ON DELETE SET NULL
      const pagos = await getCachedByIndex('pagos', 'deuda_id', id);
      for (const p of pagos) await cacheOne('pagos', { ...p, deuda_id: null, deudas: null });
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
 * @param {'insert'|'update'|'delete'|'upload'} operacion - Tipo de operación
 * @param {object} datos - Datos de la operación (siempre con `id` del registro)
 */
export async function addPendingSync(tabla, operacion, datos) {
  try {
    await db.pending_sync.add({
      tabla,
      operacion,
      datos,
      timestamp: Date.now(),
      estado: 'pendiente',
      intentos: 0,
      proximoIntento: 0,
    });
    notifyQueueChange('nueva');
  } catch (error) {
    console.error('[Offline] Error agregando pendiente:', error);
  }
}

/**
 * Encola la subida de un archivo elegido sin conexión (el File se guarda en
 * IndexedDB). Al sincronizar se sube a Storage y se guarda la ruta en el campo
 * `campo` del registro `registroId` de `tabla`. Tiene que encolarse después del
 * insert de ese registro.
 */
export async function addPendingUpload({ tabla, registroId, campo, bucket, path, file }) {
  await addPendingSync(tabla, 'upload', { id: registroId, campo, bucket, path, file });
}

/**
 * Borra una orden en Supabase. Las foreign keys se encargan del resto: tareas,
 * repuestos y archivos se borran (CASCADE) y las deudas y pagos quedan sin
 * orden (SET NULL). Los archivos de Storage no tienen foreign key, así que se
 * borran a mano; si eso falla, la orden igual queda borrada.
 */
export async function deleteOrdenEnServidor(id) {
  const { data: archivos } = await supabase
    .from('archivos')
    .select('ruta_storage')
    .eq('orden_id', id);

  const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id);
  if (error) throw error;

  const rutas = (archivos || []).map(a => a.ruta_storage).filter(Boolean);
  if (rutas.length > 0) {
    const { error: storageError } = await supabase.storage.from('archivos').remove(rutas);
    if (storageError) console.warn('[Ordenes] No se pudieron borrar los archivos de Storage:', storageError);
  }
}

/**
 * Operaciones que todavía hay que mandar, en orden FIFO.
 */
export async function getPendingSyncs() {
  try {
    const pendientes = await db.pending_sync.where('estado').equals('pendiente').toArray();
    return pendientes.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error('[Offline] Error leyendo pendientes:', error);
    return [];
  }
}

/**
 * Cuenta las operaciones pendientes (sin contar las de la bandeja de errores).
 */
export async function getPendingCount() {
  try {
    return await db.pending_sync.where('estado').equals('pendiente').count();
  } catch {
    return 0;
  }
}

// =============================================================================
// BANDEJA DE ERRORES: operaciones que fallaron de forma permanente
// =============================================================================

export async function getSyncErrors() {
  try {
    const errores = await db.pending_sync.where('estado').equals('error').toArray();
    return errores.sort((a, b) => a.id - b.id);
  } catch {
    return [];
  }
}

export async function getSyncErrorCount() {
  try {
    return await db.pending_sync.where('estado').equals('error').count();
  } catch {
    return 0;
  }
}

/** Devuelve la operación a la cola para intentarla otra vez. */
export async function retrySyncError(id) {
  await db.pending_sync.update(id, { estado: 'pendiente', intentos: 0, esperas: 0, proximoIntento: 0, ultimoError: null });
  notifyQueueChange('nueva');
}

/**
 * Descarta la operación. El cambio local que la originó se pierde: la próxima
 * vez que se lean los datos con conexión, la reconciliación del caché vuelve
 * al estado del servidor.
 */
export async function discardSyncError(id) {
  await db.pending_sync.delete(id);
  notifyQueueChange();
}

// =============================================================================
// PROCESAMIENTO DE LA COLA
// =============================================================================

// Códigos de Postgres que indican un problema momentáneo
const PG_TRANSITORIOS = new Set(['40001', '40P01', '55P03', '57014', '53300']);

/**
 * Clasifica un error de Supabase:
 * - 'red': no hubo respuesta (sin conexión real). Se reintenta sin límite.
 * - 'transitorio': el servidor respondió con un problema momentáneo (5xx,
 *   timeout, sesión vencida). Se reintenta hasta MAX_INTENTOS.
 * - 'permanente': el servidor rechazó los datos (constraint, permisos,
 *   formato). Reintentar no sirve: va a la bandeja de errores.
 */
export function clasificarError(error) {
  const status = Number(error?.status ?? error?.statusCode) || 0;
  const code = error?.code ? String(error.code) : '';

  if (PG_TRANSITORIOS.has(code) || code.startsWith('08') || code === 'PGRST301') return 'transitorio';
  if (status === 401 || status === 408 || status === 429 || status >= 500) return 'transitorio';
  if (!status && !code) return 'red';
  return 'permanente';
}

/** Mensaje entendible para mostrar en la bandeja. */
export function describirError(error) {
  const code = error?.code ? String(error.code) : '';
  const detalle = error?.details || error?.message || 'Error desconocido';
  switch (code) {
    case '23505': return `Ya existe un registro con esos datos (${detalle})`;
    case '23503': return 'Hace referencia a un registro que no existe o que se borró';
    case '23514': return `Algún valor no es válido (${detalle})`;
    case '42501': return 'Sin permisos para hacer este cambio';
    default: return detalle;
  }
}

/**
 * Un insert que falla por clave duplicada (23505) puede ser un reintento de
 * algo que ya llegó al servidor (por ejemplo, se cortó la conexión antes de
 * recibir la respuesta). Como los ids se generan en el cliente, si el registro
 * con ese id existe, la operación ya está hecha. Si no existe, el duplicado es
 * otro campo único (por ejemplo, la patente) y es un error real.
 */
async function yaEstabaSincronizado(item, error) {
  if (item.operacion !== 'insert' || error?.code !== '23505' || !item.datos?.id) return false;
  const { data, error: selectError } = await supabase
    .from(item.tabla)
    .select('id')
    .eq('id', item.datos.id)
    .maybeSingle();
  return !selectError && !!data;
}

/** Tira el error de una respuesta de Supabase con su status HTTP adjunto. */
function lanzarSiError({ error, status }) {
  if (error) throw Object.assign(error, { status: error.status ?? status });
}

/**
 * Ejecuta una operación individual contra Supabase.
 */
async function executeSyncOperation(item) {
  const { tabla, operacion, datos } = item;

  switch (operacion) {
    case 'insert': {
      lanzarSiError(await supabase.from(tabla).insert([datos]));
      break;
    }
    case 'update': {
      const { id, ...updateData } = datos;
      lanzarSiError(await supabase.from(tabla).update(updateData).eq('id', id));
      break;
    }
    case 'delete': {
      if (tabla === 'ordenes_trabajo') {
        await deleteOrdenEnServidor(datos.id);
        break;
      }
      lanzarSiError(await supabase.from(tabla).delete().eq('id', datos.id));
      break;
    }
    case 'upload': {
      // upsert: si un intento anterior subió el archivo pero falló el update,
      // el reintento lo reemplaza en vez de fallar por duplicado.
      const { bucket, path, file, campo } = datos;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      lanzarSiError(await supabase.from(tabla).update({ [campo]: path }).eq('id', datos.id));
      break;
    }
    default:
      throw Object.assign(new Error(`Operación desconocida: ${operacion}`), { code: 'OP_DESCONOCIDA' });
  }
}

async function procesarCola({ ignorarEspera = false } = {}) {
  const resultado = { processed: 0, errores: 0, reintentarEn: null };

  // Sin sesión, RLS rechazaría todo como "sin permisos" y la cola terminaría
  // entera en la bandeja de errores. Se espera a que el usuario inicie sesión.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ...resultado, sinSesion: true };

  const pendientes = await getPendingSyncs();

  for (const item of pendientes) {
    // La cola es FIFO: si la primera operación está esperando un reintento,
    // las siguientes también esperan (pueden depender de ella).
    if (!ignorarEspera && item.proximoIntento > Date.now()) {
      resultado.reintentarEn = item.proximoIntento;
      break;
    }

    try {
      await executeSyncOperation(item);
      await db.pending_sync.delete(item.id);
      resultado.processed++;
    } catch (error) {
      if (await yaEstabaSincronizado(item, error)) {
        await db.pending_sync.delete(item.id);
        resultado.processed++;
        continue;
      }

      const tipo = clasificarError(error);
      // `intentos` cuenta los rechazos del servidor (para rendirse);
      // `esperas`, todas las fallas (para alargar la espera entre intentos).
      const intentos = (item.intentos || 0) + (tipo === 'red' ? 0 : 1);
      const esperas = (item.esperas || 0) + 1;

      if (tipo === 'permanente' || intentos >= MAX_INTENTOS) {
        console.error(`[Sync] Operación #${item.id} enviada a la bandeja de errores:`, error);
        await db.pending_sync.update(item.id, {
          estado: 'error',
          intentos,
          ultimoError: describirError(error),
        });
        resultado.errores++;
        continue;
      }

      // Error momentáneo: se corta acá para no alterar el orden de la cola.
      const proximoIntento = Date.now() + backoffMs(esperas);
      await db.pending_sync.update(item.id, { intentos, esperas, proximoIntento, ultimoError: describirError(error) });
      resultado.reintentarEn = proximoIntento;
      break;
    }
  }

  notifyQueueChange();
  return resultado;
}

let procesamientoEnCurso = null;

/**
 * Procesa la cola contra Supabase en orden FIFO.
 * - Éxito: la operación sale de la cola.
 * - Error momentáneo: se programa un reintento con espera exponencial y se
 *   corta el procesamiento (las siguientes pueden depender de esta).
 * - Error permanente: la operación pasa a la bandeja y se sigue con la próxima.
 *
 * Si ya hay un procesamiento en curso, devuelve ese mismo (lock): dos llamadas
 * en paralelo mandarían dos veces la misma operación.
 *
 * @param {{ ignorarEspera?: boolean }} [opciones] - ignorarEspera: no respetar
 *   la espera del próximo reintento (al reconectar o al pedirlo el usuario).
 * @returns {Promise<{ processed: number, errores: number, reintentarEn: number|null, sinSesion?: boolean }>}
 */
export function processPendingSyncs(opciones) {
  if (!procesamientoEnCurso) {
    procesamientoEnCurso = procesarCola(opciones).finally(() => {
      procesamientoEnCurso = null;
    });
  }
  return procesamientoEnCurso;
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
