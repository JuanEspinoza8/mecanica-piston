-- ==============================================================================
-- 006 (OPCIONAL) — Restringir el acceso a una lista de usuarios autorizados
--
-- Con la 001, cualquier usuario con sesión ve y modifica todo. Eso es seguro
-- mientras el registro público esté deshabilitado. Esta migración agrega una
-- segunda barrera: aunque alguien reactive el signup o se cree una cuenta por
-- error, si su user_id no está en usuarios_autorizados, RLS no le devuelve
-- ninguna fila y rechaza sus escrituras.
--
-- Cuándo: en cualquier momento después de la 002. No requiere cambios en el
-- front.
--
-- Paso previo obligatorio: listar los usuarios del taller y completar el
-- INSERT de abajo. Si la tabla queda vacía, el bloque de control aborta la
-- migración entera (no se aplica nada) para no dejar al taller sin acceso.
--
--   SELECT id, email, created_at FROM auth.users ORDER BY created_at;
--
-- Para volver atrás: correr de nuevo la 001 y la 002.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.usuarios_autorizados (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nota TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS activado y sin políticas: la tabla no se lee ni se escribe desde la API.
-- Se administra solo desde el SQL Editor.
ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;

-- Completar con los UID de Authentication → Users:
-- INSERT INTO public.usuarios_autorizados (user_id, nota) VALUES
--   ('00000000-0000-0000-0000-000000000000', 'Dueño del taller');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios_autorizados) THEN
    RAISE EXCEPTION 'usuarios_autorizados está vacía: completá el INSERT antes de aplicar las políticas';
  END IF;
END $$;

-- SECURITY DEFINER para poder leer la tabla (que no tiene políticas).
CREATE OR REPLACE FUNCTION public.es_usuario_autorizado()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_autorizados WHERE user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.es_usuario_autorizado() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_usuario_autorizado() TO authenticated;

-- Tablas: reemplazar "Acceso autenticado" por "Acceso usuarios autorizados".
-- (SELECT ...) hace que Postgres evalúe la función una vez por consulta y no
-- una vez por fila.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clientes', 'vehiculos', 'ordenes_trabajo', 'tareas_orden', 'repuestos',
    'deudas', 'pagos', 'notas', 'historial_modificaciones', 'archivos'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Acceso autenticado" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Acceso usuarios autorizados" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Acceso usuarios autorizados" ON public.%I
         FOR ALL TO authenticated
         USING ((SELECT public.es_usuario_autorizado()))
         WITH CHECK ((SELECT public.es_usuario_autorizado()))',
      t
    );
  END LOOP;
END $$;

-- Storage: mismas reglas que la 002, más la condición de usuario autorizado.
DROP POLICY IF EXISTS "Archivos del taller: lectura" ON storage.objects;
CREATE POLICY "Archivos del taller: lectura" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('archivos', 'archivos_pagos') AND (SELECT public.es_usuario_autorizado()));

DROP POLICY IF EXISTS "Archivos del taller: subida" ON storage.objects;
CREATE POLICY "Archivos del taller: subida" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('archivos', 'archivos_pagos') AND (SELECT public.es_usuario_autorizado()));

DROP POLICY IF EXISTS "Archivos del taller: reemplazo" ON storage.objects;
CREATE POLICY "Archivos del taller: reemplazo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('archivos', 'archivos_pagos') AND (SELECT public.es_usuario_autorizado()))
  WITH CHECK (bucket_id IN ('archivos', 'archivos_pagos') AND (SELECT public.es_usuario_autorizado()));

DROP POLICY IF EXISTS "Archivos del taller: borrado" ON storage.objects;
CREATE POLICY "Archivos del taller: borrado" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('archivos', 'archivos_pagos') AND (SELECT public.es_usuario_autorizado()));
