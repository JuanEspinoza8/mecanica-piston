import { toast } from 'sonner';
import {
  addPendingSync,
  cacheData,
  cacheOne,
  generateId,
  getCachedById,
  isOnline,
  offlineCascadeDelete,
  reconcileOne,
} from '../db/offlineService';

/**
 * Helpers para que cada hook describa QUÉ lee o escribe, sin repetir el
 * "si no hay conexión, usá IndexedDB y encolá el cambio".
 */

const tieneDatos = (valor) => (Array.isArray(valor) ? valor.length > 0 : valor != null);

/**
 * queryFn de TanStack Query para una lista con caché offline.
 *
 * - Sin conexión: devuelve `local()`.
 * - Con conexión: ejecuta `remoto()` (un query de Supabase), guarda el
 *   resultado en IndexedDB reconciliando según `alcance` y lo devuelve.
 * - Si la red falla: devuelve el caché si tiene algo; si no, el error.
 *
 * @param {object} opciones
 * @param {string} [opciones.tabla] - Tabla de IndexedDB donde guardar (sin tabla, no cachea)
 * @param {() => PromiseLike<{data: any, error: any}>} opciones.remoto
 * @param {() => Promise<any>} opciones.local - Lectura equivalente desde IndexedDB
 * @param {object|false} [opciones.alcance] - Ver cacheData
 * @param {(filas: any[]) => Promise<any[]>} [opciones.preparar] - Transforma lo que llega
 *   del servidor antes de guardarlo (por ejemplo, agregar URLs firmadas)
 * @param {(filas: any) => any} [opciones.mapear] - Formato para la UI (se aplica a ambos caminos)
 */
export function offlineQuery({ tabla, remoto, local, alcance, preparar, mapear = (x) => x }) {
  return async () => {
    if (!isOnline()) return mapear(await local());

    try {
      const { data, error } = await remoto();
      if (error) throw error;
      const filas = preparar ? await preparar(data) : data;
      if (tabla) await cacheData(tabla, filas, alcance);
      return mapear(filas);
    } catch (error) {
      const cached = await local();
      if (tieneDatos(cached)) return mapear(cached);
      throw error;
    }
  };
}

/**
 * queryFn para un registro por id. Igual que offlineQuery, pero si el
 * servidor dice que el registro no existe, también lo saca del caché (salvo
 * que tenga cambios locales sin sincronizar) y devuelve null.
 *
 * `remoto` tiene que usar maybeSingle() para que "no existe" sea data: null.
 */
export function offlineQueryOne({ tabla, id, remoto, mapear = (x) => x }) {
  return async () => {
    if (!id) return null;
    const local = async () => {
      const cached = await getCachedById(tabla, id);
      return cached ? mapear(cached) : null;
    };

    if (!isOnline()) return local();

    try {
      const { data, error } = await remoto();
      if (error) throw error;
      await reconcileOne(tabla, id, data);
      // Si no existe en el servidor pero tiene cambios locales (por ejemplo,
      // se creó offline y todavía no se sincronizó), se muestra la copia local.
      return data ? mapear(data) : local();
    } catch (error) {
      const cached = await local();
      if (cached) return cached;
      throw error;
    }
  };
}

/**
 * mutationFn que funciona con y sin conexión.
 *
 * - Con conexión: `online(variables)`.
 * - Sin conexión: `offline(variables)`, que actualiza IndexedDB y encola el
 *   cambio (con insertarOffline, actualizarOffline o borrarOffline), y un
 *   aviso "Sin conexión — ...".
 *
 * @param {object} opciones
 * @param {(variables: any) => Promise<any>} opciones.online
 * @param {(variables: any) => Promise<any>} opciones.offline
 * @param {string | ((variables: any) => string | null)} [opciones.aviso] - Texto del aviso offline
 */
export function offlineMutation({ online, offline, aviso }) {
  return async (variables) => {
    if (isOnline()) return online(variables);

    const resultado = await offline(variables);
    const texto = typeof aviso === 'function' ? aviso(variables) : aviso;
    if (texto) toast.info(`Sin conexión — ${texto}`);
    return resultado;
  };
}

/**
 * Inserta en IndexedDB y encola el insert. El id se genera en el cliente, así
 * el registro conserva el mismo id al sincronizar (y los hijos creados offline
 * pueden apuntar a él).
 *
 * @param {object} payload - Lo que se manda a Supabase
 * @param {object} [extraLocal] - Datos solo para la copia local (por ejemplo,
 *   relaciones anidadas para que la lista se vea completa offline)
 * @returns el registro local
 */
export async function insertarOffline(tabla, payload, extraLocal = {}) {
  const datos = { ...payload, id: payload.id ?? generateId() };
  const registro = { ...datos, created_at: new Date().toISOString(), ...extraLocal };
  await cacheOne(tabla, registro);
  await addPendingSync(tabla, 'insert', datos);
  return registro;
}

/** Aplica cambios a la copia local y encola el update. Devuelve el registro local. */
export async function actualizarOffline(tabla, id, cambios) {
  const actual = await getCachedById(tabla, id);
  const registro = { ...(actual || {}), ...cambios, id };
  await cacheOne(tabla, registro);
  await addPendingSync(tabla, 'update', { id, ...cambios });
  return registro;
}

/** Borra la copia local (replicando las foreign keys) y encola el delete. */
export async function borrarOffline(tabla, id) {
  await offlineCascadeDelete(tabla, id);
  await addPendingSync(tabla, 'delete', { id });
}
