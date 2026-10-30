import { describe, it, expect, beforeEach, vi } from 'vitest';
import db from './database';
import { estado, resetSupabaseFalso } from '../test/supabaseFalso';
import {
  addPendingSync,
  backoffMs,
  cacheData,
  clasificarError,
  clearLocalData,
  discardSyncError,
  getPendingCount,
  getSyncErrors,
  MAX_INTENTOS,
  offlineCascadeDelete,
  processPendingSyncs,
  retrySyncError,
} from './offlineService';

vi.mock('../lib/supabase', () => import('../test/supabaseFalso'));

const ok = { data: null, error: null, status: 201 };
const errorDeRed = { data: null, error: { message: 'TypeError: Failed to fetch', code: '' }, status: 0 };
const error503 = { data: null, error: { message: 'Service Unavailable' }, status: 503 };

const operacionesEnviadas = () =>
  estado.consultas.filter(c => c.op !== 'select').map(c => `${c.op} ${c.tabla}`);

beforeEach(async () => {
  resetSupabaseFalso();
  await Promise.all(db.tables.map(t => t.clear()));
});

describe('processPendingSyncs', () => {
  it('manda las operaciones en orden FIFO y las saca de la cola', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1', nombre: 'Ana' });
    await addPendingSync('vehiculos', 'insert', { id: 'v1', cliente_id: 'c1' });
    await addPendingSync('clientes', 'update', { id: 'c1', telefono: '123' });

    const resultado = await processPendingSyncs();

    expect(resultado).toMatchObject({ processed: 3, errores: 0, reintentarEn: null });
    expect(operacionesEnviadas()).toEqual(['insert clientes', 'insert vehiculos', 'update clientes']);
    expect(await getPendingCount()).toBe(0);
  });

  it('ante un error momentáneo corta, conserva el orden y programa un reintento', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    await addPendingSync('clientes', 'insert', { id: 'c2' });
    estado.responder = () => error503;

    const antes = Date.now();
    const resultado = await processPendingSyncs();

    expect(resultado.processed).toBe(0);
    expect(resultado.reintentarEn).toBeGreaterThanOrEqual(antes + backoffMs(1));
    // La segunda operación no se mandó: puede depender de la primera
    expect(operacionesEnviadas()).toEqual(['insert clientes']);

    const [primera] = await db.pending_sync.orderBy('id').toArray();
    expect(primera).toMatchObject({ estado: 'pendiente', intentos: 1, esperas: 1 });
  });

  it('respeta la espera del reintento salvo que se pida ignorarla', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    estado.responder = () => error503;
    await processPendingSyncs();

    estado.responder = () => ok;
    const enEspera = await processPendingSyncs();
    expect(enEspera.processed).toBe(0);

    const forzado = await processPendingSyncs({ ignorarEspera: true });
    expect(forzado.processed).toBe(1);
  });

  it('los errores de red no cuentan como intento (no se rinde sin conexión)', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    estado.responder = () => errorDeRed;

    for (let i = 0; i < MAX_INTENTOS + 2; i++) {
      await processPendingSyncs({ ignorarEspera: true });
    }

    const [op] = await db.pending_sync.toArray();
    expect(op).toMatchObject({ estado: 'pendiente', intentos: 0, esperas: MAX_INTENTOS + 2 });
  });

  it('después de MAX_INTENTOS errores del servidor manda la operación a la bandeja', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    estado.responder = () => error503;

    for (let i = 0; i < MAX_INTENTOS; i++) {
      await processPendingSyncs({ ignorarEspera: true });
    }

    const errores = await getSyncErrors();
    expect(errores).toHaveLength(1);
    expect(errores[0].intentos).toBe(MAX_INTENTOS);
    expect(await getPendingCount()).toBe(0);
  });

  it('un error permanente va a la bandeja y la cola sigue con la próxima', async () => {
    await addPendingSync('repuestos', 'insert', { id: 'r1', cantidad: 0 });
    await addPendingSync('notas', 'insert', { id: 'n1', texto: 'Llamar' });
    estado.responder = (c) => c.tabla === 'repuestos'
      ? { data: null, error: { code: '23514', message: 'violates check constraint' }, status: 400 }
      : ok;

    const resultado = await processPendingSyncs();

    expect(resultado).toMatchObject({ processed: 1, errores: 1 });
    const [error] = await getSyncErrors();
    expect(error).toMatchObject({ tabla: 'repuestos', estado: 'error' });
    expect(error.ultimoError).toMatch(/no es válido/);
  });

  it('un 23505 en un insert cuyo id ya existe se toma como ya sincronizado', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    estado.responder = (c) => {
      if (c.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate key' }, status: 409 };
      // El select que verifica si el id ya está en el servidor
      return { data: { id: 'c1' }, error: null, status: 200 };
    };

    const resultado = await processPendingSyncs();

    expect(resultado).toMatchObject({ processed: 1, errores: 0 });
    expect(await db.pending_sync.count()).toBe(0);
  });

  it('un 23505 por otro campo único (patente duplicada) es un error real', async () => {
    await addPendingSync('vehiculos', 'insert', { id: 'v1', patente: 'AB 123 CD' });
    estado.responder = (c) => c.op === 'insert'
      ? { data: null, error: { code: '23505', details: 'Key (patente)=(AB 123 CD) already exists.' }, status: 409 }
      : { data: null, error: null, status: 200 };

    const resultado = await processPendingSyncs();

    expect(resultado.errores).toBe(1);
    const [error] = await getSyncErrors();
    expect(error.ultimoError).toMatch(/Ya existe.*patente/);
  });

  it('no procesa nada sin sesión (RLS rechazaría todo)', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    estado.sesion = null;

    const resultado = await processPendingSyncs();

    expect(resultado).toMatchObject({ processed: 0, sinSesion: true });
    expect(estado.consultas).toHaveLength(0);
    expect(await getPendingCount()).toBe(1);
  });

  it('dos llamadas en paralelo comparten el mismo procesamiento (lock)', async () => {
    await addPendingSync('clientes', 'insert', { id: 'c1' });
    await addPendingSync('clientes', 'insert', { id: 'c2' });

    const [a, b] = await Promise.all([processPendingSyncs(), processPendingSyncs()]);

    expect(a).toBe(b);
    expect(operacionesEnviadas()).toEqual(['insert clientes', 'insert clientes']);
  });

  it('sube un archivo encolado offline y guarda la ruta en el registro', async () => {
    await addPendingSync('pagos', 'insert', { id: 'p1', monto: 100 });
    await addPendingSync('pagos', 'upload', {
      id: 'p1', campo: 'comprobante_url', bucket: 'archivos_pagos', path: 'c1/p1.pdf', file: 'contenido-del-pdf',
    });

    await processPendingSyncs();

    const subida = estado.consultas.find(c => c.op === 'upload');
    expect(subida).toMatchObject({ tabla: 'archivos_pagos', payload: { path: 'c1/p1.pdf', opciones: { upsert: true } } });
    const update = estado.consultas.find(c => c.op === 'update');
    expect(update).toMatchObject({ tabla: 'pagos', payload: { comprobante_url: 'c1/p1.pdf' }, filtros: [['id', 'p1']] });
  });
});

describe('bandeja de errores', () => {
  const crearError = async () => {
    await addPendingSync('notas', 'insert', { id: 'n1' });
    estado.responder = () => ({ data: null, error: { code: '42501', message: 'rls' }, status: 403 });
    await processPendingSyncs();
    const [error] = await getSyncErrors();
    return error;
  };

  it('reintentar devuelve la operación a la cola', async () => {
    const error = await crearError();

    await retrySyncError(error.id);

    expect(await getSyncErrors()).toHaveLength(0);
    expect(await getPendingCount()).toBe(1);
  });

  it('descartar la saca de la cola', async () => {
    const error = await crearError();

    await discardSyncError(error.id);

    expect(await db.pending_sync.count()).toBe(0);
  });
});

describe('cacheData (reconciliación)', () => {
  it('sin alcance borra lo que ya no está en el servidor', async () => {
    await db.clientes.bulkPut([{ id: 'c1' }, { id: 'c2' }]);

    await cacheData('clientes', [{ id: 'c1', nombre: 'Ana' }]);

    expect(await db.clientes.toArray()).toEqual([{ id: 'c1', nombre: 'Ana' }]);
  });

  it('con alcance solo reconcilia los registros de ese filtro', async () => {
    await db.repuestos.bulkPut([
      { id: 'r1', orden_id: 'o1' },
      { id: 'r2', orden_id: 'o1' },
      { id: 'r3', orden_id: 'o2' },
    ]);

    await cacheData('repuestos', [{ id: 'r1', orden_id: 'o1' }], { campo: 'orden_id', valor: 'o1' });

    const ids = (await db.repuestos.toArray()).map(r => r.id).sort();
    expect(ids).toEqual(['r1', 'r3']);
  });

  it('no borra ni pisa registros con cambios locales sin sincronizar', async () => {
    await db.clientes.bulkPut([{ id: 'local', nombre: 'Creado offline' }, { id: 'c1', nombre: 'Editado offline' }]);
    await addPendingSync('clientes', 'insert', { id: 'local' });
    await addPendingSync('clientes', 'update', { id: 'c1', nombre: 'Editado offline' });

    await cacheData('clientes', [{ id: 'c1', nombre: 'Versión del servidor' }]);

    const clientes = await db.clientes.orderBy('id').toArray();
    expect(clientes).toEqual([
      { id: 'c1', nombre: 'Editado offline' },
      { id: 'local', nombre: 'Creado offline' },
    ]);
  });

  it('con alcance false (consulta parcial) guarda sin borrar', async () => {
    await db.historial_modificaciones.bulkPut([{ id: 'h1', vehiculo_id: 'v1' }]);

    await cacheData('historial_modificaciones', [{ id: 'h2', vehiculo_id: 'v1' }], false);

    expect(await db.historial_modificaciones.count()).toBe(2);
  });
});

describe('offlineCascadeDelete', () => {
  it('al borrar una orden conserva deudas y pagos sin vínculo (ON DELETE SET NULL)', async () => {
    await db.ordenes_trabajo.put({ id: 'o1', vehiculo_id: 'v1' });
    await db.deudas.put({ id: 'd1', cliente_id: 'c1', orden_id: 'o1' });
    await db.pagos.put({ id: 'p1', cliente_id: 'c1', orden_id: 'o1', deuda_id: 'd1' });
    await db.tareas_orden.put({ id: 't1', orden_id: 'o1' });
    await db.repuestos.put({ id: 'r1', orden_id: 'o1' });

    await offlineCascadeDelete('ordenes_trabajo', 'o1');

    expect(await db.ordenes_trabajo.count()).toBe(0);
    expect(await db.tareas_orden.count()).toBe(0);
    expect(await db.repuestos.count()).toBe(0);
    expect((await db.deudas.get('d1')).orden_id).toBeNull();
    expect((await db.pagos.get('p1')).orden_id).toBeNull();
  });

  it('al borrar una deuda desvincula sus pagos', async () => {
    await db.deudas.put({ id: 'd1', cliente_id: 'c1' });
    await db.pagos.put({ id: 'p1', cliente_id: 'c1', deuda_id: 'd1' });

    await offlineCascadeDelete('deudas', 'd1');

    expect(await db.deudas.count()).toBe(0);
    expect((await db.pagos.get('p1')).deuda_id).toBeNull();
  });
});

describe('clearLocalData', () => {
  it('borra el caché y la cola', async () => {
    await db.clientes.put({ id: 'c1' });
    await addPendingSync('clientes', 'update', { id: 'c1' });

    await clearLocalData();

    expect(await db.clientes.count()).toBe(0);
    expect(await db.pending_sync.count()).toBe(0);
  });
});

describe('clasificarError', () => {
  it.each([
    [{ message: 'Failed to fetch', code: '' }, 'red'],
    [{ message: 'Bad gateway', status: 502 }, 'transitorio'],
    [{ code: 'PGRST301', status: 401 }, 'transitorio'],
    [{ code: '40P01' }, 'transitorio'],
    [{ code: '23505', status: 409 }, 'permanente'],
    [{ code: '42501', status: 403 }, 'permanente'],
    [{ statusCode: '400', message: 'Invalid key' }, 'permanente'],
  ])('%o → %s', (error, tipo) => {
    expect(clasificarError(error)).toBe(tipo);
  });

  it('el backoff crece exponencialmente con un tope', () => {
    expect(backoffMs(1)).toBe(2000);
    expect(backoffMs(2)).toBe(4000);
    expect(backoffMs(20)).toBe(5 * 60 * 1000);
  });
});
