-- ==============================================================================
-- 004 — Guardar la mano de obra de cada orden
--
-- Hasta ahora la mano de obra vivía solo en el estado de React y se perdía al
-- recargar la página.
--
-- Cuándo: ANTES de desplegar el front nuevo. Es compatible con el front
-- actual (agrega una columna con valor por defecto que el front viejo ignora).
-- ==============================================================================

ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS mano_de_obra DECIMAL(10, 2) NOT NULL DEFAULT 0
  CHECK (mano_de_obra >= 0);
