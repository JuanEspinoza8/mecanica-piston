-- ==============================================================================
-- 001 — Reemplazar las políticas abiertas por acceso solo autenticado
--
-- Cuándo: una sola vez, en una base creada con la versión vieja del schema
-- (la que tenía las políticas "Permitir todo a todos temporalmente").
-- Es idempotente: se puede volver a correr sin romper nada.
--
-- Verificación después de correrla:
--   select tablename, policyname, roles, qual
--   from pg_policies where schemaname = 'public';
-- No tiene que aparecer ninguna política con qual = 'true' para el rol public.
--
-- IMPORTANTE: estas políticas dejan entrar a cualquier usuario con sesión.
-- El registro público tiene que estar deshabilitado en
-- Authentication → Sign In / Providers → "Allow new users to sign up".
-- ==============================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clientes', 'vehiculos', 'ordenes_trabajo', 'tareas_orden', 'repuestos',
    'deudas', 'pagos', 'notas', 'historial_modificaciones', 'archivos'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Acceso autenticado" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Acceso autenticado" ON public.%I
         FOR ALL TO authenticated
         USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
