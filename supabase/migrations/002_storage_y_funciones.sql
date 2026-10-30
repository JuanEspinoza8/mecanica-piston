-- ==============================================================================
-- 002 — Políticas de Storage y funciones más seguras
--
-- Cuándo: ANTES de desplegar la versión del front que usa URLs firmadas.
-- Es compatible con el front actual: no cambia nada de lo que ya funciona.
-- Es idempotente.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Storage: solo usuarios autenticados leen y escriben en los buckets
--    del taller. createSignedUrl necesita permiso de SELECT sobre
--    storage.objects, y la subida diferida de comprobantes usa upsert
--    (INSERT + UPDATE).
--    Si ya creaste políticas parecidas desde el dashboard, estas se suman
--    (las políticas se combinan con OR); podés borrar las viejas después.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Archivos del taller: lectura" ON storage.objects;
CREATE POLICY "Archivos del taller: lectura" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('archivos', 'archivos_pagos'));

DROP POLICY IF EXISTS "Archivos del taller: subida" ON storage.objects;
CREATE POLICY "Archivos del taller: subida" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('archivos', 'archivos_pagos'));

DROP POLICY IF EXISTS "Archivos del taller: reemplazo" ON storage.objects;
CREATE POLICY "Archivos del taller: reemplazo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('archivos', 'archivos_pagos'))
  WITH CHECK (bucket_id IN ('archivos', 'archivos_pagos'));

DROP POLICY IF EXISTS "Archivos del taller: borrado" ON storage.objects;
CREATE POLICY "Archivos del taller: borrado" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('archivos', 'archivos_pagos'));

-- ------------------------------------------------------------------------------
-- 2. get_saldo_cliente era SECURITY DEFINER: se ejecutaba con permisos del
--    dueño de la base, salteaba RLS y el rol anon podía llamarla por RPC.
--    Pasa a SECURITY INVOKER (respeta RLS) y solo la ejecutan usuarios
--    autenticados.
-- ------------------------------------------------------------------------------

ALTER FUNCTION public.get_saldo_cliente(UUID) SECURITY INVOKER;
ALTER FUNCTION public.get_saldo_cliente(UUID) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_saldo_cliente(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_saldo_cliente(UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. Las funciones de los triggers de historial son SECURITY DEFINER: fijar
--    el search_path evita que un objeto con el mismo nombre en otro schema
--    las secuestre (es lo que marca el linter de Supabase).
-- ------------------------------------------------------------------------------

ALTER FUNCTION public.trg_historial_orden_creada() SET search_path = public;
ALTER FUNCTION public.trg_historial_orden_estado() SET search_path = public;
ALTER FUNCTION public.trg_historial_repuesto_agregado() SET search_path = public;
ALTER FUNCTION public.trg_historial_repuesto_eliminado() SET search_path = public;
