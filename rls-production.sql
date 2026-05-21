-- ==============================================================================
-- ACTUALIZACIÓN DE SEGURIDAD: Reemplazar políticas abiertas por autenticadas
-- Ejecutar en Supabase → SQL Editor
-- ==============================================================================

-- 1. Borrar las políticas abiertas existentes
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.clientes;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.vehiculos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.ordenes_trabajo;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.repuestos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.tareas_orden;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.pagos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.deudas;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.notas;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.historial_modificaciones;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.archivos;

-- 2. Crear políticas que solo permiten acceso a usuarios logueados
-- auth.role() = 'authenticated' → solo pasa si hay sesión activa

CREATE POLICY "Acceso autenticado" ON public.clientes
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.vehiculos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.ordenes_trabajo
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.repuestos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.tareas_orden
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.pagos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.deudas
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.notas
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.historial_modificaciones
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso autenticado" ON public.archivos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
