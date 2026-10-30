import db from './database';
import { supabase } from '../lib/supabase';

/**
 * Servicio de sincronización offline para Mecánica Pistón.
 *
 * Funciones principales:
 * - cacheData(): guarda datos de Supabase en IndexedDB y borra lo que ya no existe
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

// PostgREST devuelve como máximo esta cantidad de filas por consulta (es el
// "Max rows" por defecto de Supabase). Una respuesta de ese tamaño puede estar
// cortada, así que no se usa para decidir qué borrar del caché.
export const MAX_FILAS_SERVIDOR = 1000;

/**
 * Cambios locales sin sincronizar (pendientes o en la bandeja de errores) de
 * una tabla: id → 'delete' si el registro se borró localmente, 'upsert' si se
 * creó o modificó. El servidor todavía no los conoce, así que la
 * reconciliación no los borra ni los pisa y las lecturas los superponen.
 */
export async function getCambiosLocales(tabla) {
  const ops = await db.pending_sync.where('tabla').equals(tabla).toArray();
  const cambios = new Map();
  for (const op of ops) {
    const id = op.datos?.id;
    if (!id) continue;
    if (op.operacion === 'delete') cambios.set(id, 'delete');
    else if (cambios.get(id) !== 'delete') cambios.set(id, 'upsert');
  }
  return cambios;
}

export async function tieneCambiosLocales(tabla, id) {
  return (await getCambiosLocales(tabla)).has(id);
}

/**
 * Hay sesión iniciada. Sin sesión, supabase-js manda las consultas con la
 * anon key y RLS devuelve listas vacías sin error: no hay que tomarlas como
 * "el servidor no tiene nada".
 */
export async function haySesion() {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  } catch {
    return false;
  }
}

/**
 * Guarda lo que devolvió Supabase y reconcilia: borra del caché los registros
 * que ya no existen en el servidor (por ejemplo, borrados desde otro
 * dispositivo).
 *
 * @param {string} tabla
 * @param {object[]} datos - Filas devueltas por Supabase (con id)
 * @param {{campo: string, valor: any} | false} [alcance] - Qué parte de la tabla
 *   representa `datos`. Sin alcance = la tabla completa. `{ campo, valor }` = solo
 *   los registros con ese valor (por ejemplo, los repuestos de una orden).
 *   `false` = consulta parcial (limit, varios filtros): guarda sin borrar nada.
 *   Tampoco se borra nada si la respuesta pudo venir cortada (MAX_FILAS_SERVIDOR).
 */
export async function cacheData(tabla, datos, alcance) {
  try {
    if (!Array.isArray(datos)) return;

    await db.transaction('rw', db[tabla], db.pending_sync, async () => {
      const locales = await getCambiosLocales(tabla);

      if (alcance !== false && datos.length < MAX_FILAS_SERVIDOR) {
        const enServidor = new Set(datos.map(d => d.id));
        const enCache = alcance
          ? await db[tabla].where(alcance.campo).equals(alcance.valor).primaryKeys()
          : await db[tabla].toCollection().primaryKeys();
        const borrados = enCache.filter(id => !enServidor.has(id) && !locales.has(id));
        if (borrados.length > 0) await db[tabla].bulkDelete(borrados);
      }

      const nuevos = datos.filter(d => !locales.has(d.id));
      if (nuevos.length > 0) await db[tabla].bulkPut(nuevos);
    });
  } catch (error) {
    console.warn(`[Offline] Error cacheando ${tabla}:`, error);
  }
}

/**
 * cacheData para una consulta por id: guarda el registro o, si el servidor
 * dice que no existe (dato = null), lo borra del caché. No toca registros con
 * cambios locales sin sincronizar.
 */
export async function reconcileOne(tabla, id, dato) {
  try {
    await db.transaction('rw', db[tabla], db.pending_sync, async () => {
      const locales = await getCambiosLocales(tabla);
      if (locales.has(id)) return;
      if (dato) await db[tabla].put(dato);
      else await db[tabla].delete(id);
    });
  } catch (error) {
    console.warn(`[Offline] Error cacheando ${tabla}/${id}:`, error);
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

/**
 * Borra todo lo guardado en el dispositivo: el caché de IndexedDB (incluida
 * la cola) y las respuestas de Supabase que guardó el service worker. Se usa
 * al cerrar sesión para que el próximo usuario no vea datos ajenos.
 */
export async function clearLocalData() {
  await Promise.all(db.tables.map(table => table.clear()));
  if (typeof caches !== 'undefined') {
    await Promise.all(['supabase-api-cache', 'supabase-storage-cache'].map(name => caches.delete(name)));
  }
  notifyQueueChange();
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
  // Si falla (por ejemplo, IndexedDB sin espacio para un PDF), el error se
  // propaga: la pantalla no tiene que decir "guardado" si no se encoló nada.
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
}

/**
 * Deshace un alta offline que todavía no se sincronizó: saca de la cola todas
 * sus operaciones y borra la copia local.
 */
export async function deshacerAltaOffline(tabla, id) {
  await db.pending_sync
    .where('tabla').equals(tabla)
    .filter(op => op.datos?.id === id)
    .delete();
  await removeCached(tabla, id);
  notifyQueueChange();
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

  lanzarSiError(await supabase.from('ordenes_trabajo').delete().eq('id', id));

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
  if (!status && !code) {
    // Solo es "de red" si de verdad no hubo respuesta. Cualquier otra falla
    // sin status (un error inesperado) cuenta como intento, así no bloquea la
    // cola para siempre.
    const sinConexion = typeof navigator !== 'undefined' && navigator.onLine === false;
    const falloFetch = /failed to fetch|networkerror|load failed|fetch failed|network request failed/i
      .test(error?.message || '');
    return sinConexion || falloFetch || error?.name === 'StorageUnknownError' ? 'red' : 'transitorio';
  }
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
    case 'SIN_FILAS': return 'El registro ya no existe en el servidor (puede que lo hayan borrado desde otro dispositivo)';
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
 * Un update que no encuentra la fila no da error en PostgREST: la operación
 * se daría por sincronizada aunque el cambio se haya perdido. Por eso se pide
 * el id de vuelta y 0 filas cuenta como error.
 */
async function actualizarEnServidor(tabla, id, cambios) {
  const respuesta = await supabase.from(tabla).update(cambios).eq('id', id).select('id');
  lanzarSiError(respuesta);
  if (!respuesta.data || respuesta.data.length === 0) {
    throw Object.assign(new Error(`${tabla}/${id} no existe en el servidor`), { code: 'SIN_FILAS' });
  }
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
      await actualizarEnServidor(tabla, id, updateData);
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

      await actualizarEnServidor(tabla, datos.id, { [campo]: path });
      break;
    }
    default:
      throw Object.assign(new Error(`Operación desconocida: ${operacion}`), { code: 'OP_DESCONOCIDA' });
  }
}

// Sin sesión (por ejemplo, falló el refresh del token al reconectar) se
// vuelve a probar en este tiempo.
const ESPERA_SIN_SESION_MS = 30 * 1000;

const claveRegistro = (op) => `${op.tabla}:${op.datos?.id}`;

async function procesarCola({ ignorarEspera = false } = {}) {
  const resultado = { processed: 0, errores: 0, reintentarEn: null };

  // Sin sesión, RLS rechazaría todo como "sin permisos" y la cola terminaría
  // entera en la bandeja de errores. Se espera a tener sesión.
  if (!(await haySesion())) {
    return { ...resultado, sinSesion: true, reintentarEn: Date.now() + ESPERA_SIN_SESION_MS };
  }

  // Registros con una operación en la bandeja: sus operaciones siguientes
  // esperan a que el usuario la reintente o la descarte. Si se mandaran, un
  // update sobre un alta que falló se perdería.
  const bloqueados = new Set((await getSyncErrors()).map(claveRegistro));
  const pendientes = await getPendingSyncs();

  for (const item of pendientes) {
    if (bloqueados.has(claveRegistro(item))) continue;

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

      let tipo = clasificarError(error);
      // Un update sin filas puede ser porque se perdió la sesión a mitad de
      // camino (RLS filtra todo): en ese caso es momentáneo.
      if (error?.code === 'SIN_FILAS' && !(await haySesion())) tipo = 'transitorio';
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
        bloqueados.add(claveRegistro(item));
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
let otraVuelta = false;

// Entre pestañas de la misma app (comparten IndexedDB) se usa Web Locks para
// que una sola procese la cola. Si el navegador no lo soporta, sigue sin lock.
function conLockEntrePestanas(fn) {
  const locks = globalThis.navigator?.locks;
  return locks?.request ? locks.request('mecanica-piston-sync', fn) : fn();
}

/**
 * Procesa la cola contra Supabase en orden FIFO.
 * - Éxito: la operación sale de la cola.
 * - Error momentáneo: se programa un reintento con espera exponencial y se
 *   corta el procesamiento (las siguientes pueden depender de esta).
 * - Error permanente: la operación pasa a la bandeja y se sigue con la próxima.
 *
 * Si ya hay un procesamiento en curso, devuelve ese mismo (lock): dos llamadas
 * en paralelo mandarían dos veces la misma operación. Igual se anota que hay
 * que dar otra vuelta, por si mientras tanto se encoló algo nuevo.
 *
 * @param {{ ignorarEspera?: boolean }} [opciones] - ignorarEspera: no respetar
 *   la espera del próximo reintento (al reconectar o al pedirlo el usuario).
 * @returns {Promise<{ processed: number, errores: number, reintentarEn: number|null, sinSesion?: boolean }>}
 */
export function processPendingSyncs(opciones) {
  if (procesamientoEnCurso) {
    otraVuelta = true;
    return procesamientoEnCurso;
  }

  procesamientoEnCurso = conLockEntrePestanas(async () => {
    const total = { processed: 0, errores: 0, reintentarEn: null };
    let primera = true;
    do {
      otraVuelta = false;
      // Las vueltas extra respetan la espera de los reintentos
      const vuelta = await procesarCola(primera ? opciones : undefined);
      primera = false;
      total.processed += vuelta.processed;
      total.errores += vuelta.errores;
      total.reintentarEn = vuelta.reintentarEn;
      total.sinSesion = vuelta.sinSesion;
    } while (otraVuelta);
    return total;
  }).finally(() => {
    procesamientoEnCurso = null;
  });
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
