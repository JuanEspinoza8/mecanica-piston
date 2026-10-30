/**
 * Cliente de Supabase falso para los tests. Se usa con:
 *
 *   vi.mock('../lib/supabase', () => import('../test/supabaseFalso'));
 *
 * Registra cada consulta que se ejecuta y la resuelve con lo que devuelva
 * `estado.responder(consulta)`. Una consulta es { tabla, op, payload, filtros }
 * y se ejecuta al hacer await, igual que el query builder real.
 */
export const estado = {
  consultas: [],
  sesion: null,
  responder: null,
};

export function resetSupabaseFalso() {
  estado.consultas = [];
  estado.sesion = { user: { id: 'usuario-test' } };
  estado.responder = () => ({ data: null, error: null, status: 200 });
}

resetSupabaseFalso();

function ejecutar(consulta) {
  estado.consultas.push(consulta);
  return Promise.resolve(estado.responder(consulta));
}

function from(tabla) {
  const consulta = { tabla, op: 'select', payload: null, filtros: [] };
  const builder = {
    insert(filas) { consulta.op = 'insert'; consulta.payload = filas; return builder; },
    update(valores) { consulta.op = 'update'; consulta.payload = valores; return builder; },
    delete() { consulta.op = 'delete'; return builder; },
    select() { return builder; },
    eq(campo, valor) { consulta.filtros.push([campo, valor]); return builder; },
    maybeSingle() { return builder; },
    then(resolve, reject) { return ejecutar(consulta).then(resolve, reject); },
  };
  return builder;
}

export const supabase = {
  from,
  auth: {
    getSession: async () => ({ data: { session: estado.sesion } }),
  },
  storage: {
    from: (bucket) => ({
      upload: (path, file, opciones) => ejecutar({ tabla: bucket, op: 'upload', payload: { path, file, opciones }, filtros: [] }),
      remove: (rutas) => ejecutar({ tabla: bucket, op: 'remove', payload: rutas, filtros: [] }),
    }),
  },
};
