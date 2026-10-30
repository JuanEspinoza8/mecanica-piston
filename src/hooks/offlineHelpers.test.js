import { describe, it, expect, beforeEach, vi } from 'vitest';
import db from '../db/database';
import { addPendingSync } from '../db/offlineService';
import { estado, resetSupabaseFalso } from '../test/supabaseFalso';
import { actualizarOffline, borrarOffline, insertarOffline, offlineMutation, offlineQuery, offlineQueryOne } from './offlineHelpers';

vi.mock('../lib/supabase', () => import('../test/supabaseFalso'));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

const conexion = (online) => vi.stubGlobal('navigator', { onLine: online });
const respuesta = (data) => () => Promise.resolve({ data, error: null });
const falla = () => Promise.resolve({ data: null, error: { message: 'Failed to fetch' } });

beforeEach(async () => {
  resetSupabaseFalso();
  conexion(true);
  await Promise.all(db.tables.map(t => t.clear()));
});

describe('offlineQuery', () => {
  it('con conexión trae del servidor, cachea y mapea', async () => {
    const queryFn = offlineQuery({
      tabla: 'clientes',
      remoto: respuesta([{ id: 'c1', nombre: 'ana' }]),
      local: () => db.clientes.toArray(),
      mapear: (filas) => filas.map(c => c.nombre.toUpperCase()),
    });

    expect(await queryFn()).toEqual(['ANA']);
    expect(await db.clientes.get('c1')).toEqual({ id: 'c1', nombre: 'ana' });
  });

  it('sin conexión lee el caché sin tocar la red', async () => {
    await db.clientes.put({ id: 'c1', nombre: 'Ana' });
    conexion(false);
    const remoto = vi.fn();

    const resultado = await offlineQuery({ remoto, local: () => db.clientes.toArray() })();

    expect(resultado).toEqual([{ id: 'c1', nombre: 'Ana' }]);
    expect(remoto).not.toHaveBeenCalled();
  });

  it('sin sesión no va a la red: RLS devolvería una lista vacía y se vaciaría el caché', async () => {
    await db.clientes.put({ id: 'c1' });
    estado.sesion = null;
    const remoto = vi.fn().mockResolvedValue({ data: [], error: null });

    const resultado = await offlineQuery({ tabla: 'clientes', remoto, local: () => db.clientes.toArray() })();

    expect(resultado).toEqual([{ id: 'c1' }]);
    expect(remoto).not.toHaveBeenCalled();
    expect(await db.clientes.count()).toBe(1);
  });

  it('superpone los cambios offline que todavía no se sincronizaron', async () => {
    await db.pagos.bulkPut([
      { id: 'nuevo', monto: 500 },
      { id: 'editado', monto: 999 },
    ]);
    await addPendingSync('pagos', 'insert', { id: 'nuevo' });
    await addPendingSync('pagos', 'update', { id: 'editado', monto: 999 });
    await addPendingSync('pagos', 'delete', { id: 'borrado' });

    const resultado = await offlineQuery({
      tabla: 'pagos',
      remoto: respuesta([{ id: 'editado', monto: 100 }, { id: 'borrado', monto: 50 }, { id: 'otro', monto: 10 }]),
      local: () => db.pagos.toArray(),
    })();

    expect(resultado).toEqual([
      { id: 'editado', monto: 999 },
      { id: 'otro', monto: 10 },
      { id: 'nuevo', monto: 500 },
    ]);
  });

  it('si la red falla usa el caché, y si el caché está vacío propaga el error', async () => {
    const queryFn = offlineQuery({ remoto: falla, local: () => db.clientes.toArray() });
    await expect(queryFn()).rejects.toMatchObject({ message: 'Failed to fetch' });

    await db.clientes.put({ id: 'c1' });
    expect(await queryFn()).toEqual([{ id: 'c1' }]);
  });
});

describe('offlineQueryOne', () => {
  it('si el servidor dice que no existe, lo saca del caché y devuelve null', async () => {
    await db.ordenes_trabajo.put({ id: 'o1' });

    const resultado = await offlineQueryOne({ tabla: 'ordenes_trabajo', id: 'o1', remoto: respuesta(null) })();

    expect(resultado).toBeNull();
    expect(await db.ordenes_trabajo.get('o1')).toBeUndefined();
  });

  it('muestra la copia local si se creó offline y todavía no se sincronizó', async () => {
    await db.ordenes_trabajo.put({ id: 'o1', descripcion: 'Creada offline' });
    await addPendingSync('ordenes_trabajo', 'insert', { id: 'o1' });

    const resultado = await offlineQueryOne({ tabla: 'ordenes_trabajo', id: 'o1', remoto: respuesta(null) })();

    expect(resultado).toEqual({ id: 'o1', descripcion: 'Creada offline' });
  });
});

describe('offlineMutation', () => {
  it('con conexión pero con cambios del registro en la cola, encola para respetar el orden', async () => {
    await addPendingSync('ordenes_trabajo', 'insert', { id: 'o1' });
    const online = vi.fn();
    const offline = vi.fn().mockResolvedValue('encolado');

    const resultado = await offlineMutation({ online, offline, tabla: 'ordenes_trabajo' })('o1');

    expect(resultado).toBe('encolado');
    expect(online).not.toHaveBeenCalled();
  });

  it('con conexión ejecuta online', async () => {
    const online = vi.fn().mockResolvedValue('ok');
    const offline = vi.fn();

    expect(await offlineMutation({ online, offline })({ id: 1 })).toBe('ok');
    expect(offline).not.toHaveBeenCalled();
  });

  it('sin conexión ejecuta offline y avisa', async () => {
    const { toast } = await import('sonner');
    conexion(false);

    const resultado = await offlineMutation({
      online: vi.fn(),
      offline: async () => 'local',
      aviso: 'Guardado localmente',
    })({});

    expect(resultado).toBe('local');
    expect(toast.info).toHaveBeenCalledWith('Sin conexión — Guardado localmente');
  });
});

describe('primitivas offline', () => {
  it('insertarOffline genera el id, cachea con los datos extra y encola solo el payload', async () => {
    const registro = await insertarOffline('vehiculos', { patente: 'AB 123 CD' }, { clientes: { nombre: 'Ana' } });

    expect(registro.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await db.vehiculos.get(registro.id)).toMatchObject({ patente: 'AB 123 CD', clientes: { nombre: 'Ana' } });
    const [op] = await db.pending_sync.toArray();
    expect(op).toMatchObject({ tabla: 'vehiculos', operacion: 'insert', datos: { id: registro.id, patente: 'AB 123 CD' } });
    expect(op.datos.clientes).toBeUndefined();
  });

  it('actualizarOffline conserva los campos que no cambian', async () => {
    await db.clientes.put({ id: 'c1', nombre: 'Ana', telefono: '111' });

    await actualizarOffline('clientes', 'c1', { telefono: '222' });

    expect(await db.clientes.get('c1')).toEqual({ id: 'c1', nombre: 'Ana', telefono: '222' });
    const [op] = await db.pending_sync.toArray();
    expect(op.datos).toEqual({ id: 'c1', telefono: '222' });
  });

  it('borrarOffline borra en cascada y encola el delete', async () => {
    await db.vehiculos.put({ id: 'v1', cliente_id: 'c1' });
    await db.ordenes_trabajo.put({ id: 'o1', vehiculo_id: 'v1' });

    await borrarOffline('vehiculos', 'v1');

    expect(await db.vehiculos.count()).toBe(0);
    expect(await db.ordenes_trabajo.count()).toBe(0);
    const [op] = await db.pending_sync.toArray();
    expect(op).toMatchObject({ tabla: 'vehiculos', operacion: 'delete', datos: { id: 'v1' } });
  });
});
