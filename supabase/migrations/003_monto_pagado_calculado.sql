-- ==============================================================================
-- 003 — monto_pagado y estado de las deudas se calculan en Postgres
--
-- Problema: el front leía monto_pagado, le sumaba el pago y escribía el
-- resultado. Dos dispositivos (o un pago encolado offline) se pisaban entre sí,
-- y borrar un pago sin conexión no descontaba nada.
--
-- Solución: monto_pagado deja de ser un dato que escribe el cliente.
--   - Un trigger BEFORE INSERT/UPDATE en deudas recalcula monto_pagado y estado
--     sumando la tabla pagos, ignorando lo que haya mandado el cliente.
--   - Un trigger AFTER INSERT/UPDATE/DELETE en pagos "toca" la deuda afectada
--     para que se recalcule.
--
-- Cuándo: ANTES de desplegar el front nuevo. Es compatible con el front
-- actual: si el front viejo escribe monto_pagado, el trigger lo reemplaza por
-- el valor correcto.
--
-- Antes de correrla, mirá qué deudas van a cambiar (el recálculo usa los pagos
-- reales, así que corrige las que quedaron mal por los bugs):
--
--   SELECT d.id, d.concepto, d.monto_total,
--          d.monto_pagado AS actual,
--          LEAST(COALESCE(SUM(p.monto), 0), d.monto_total) AS recalculado
--   FROM public.deudas d
--   LEFT JOIN public.pagos p ON p.deuda_id = d.id
--   GROUP BY d.id
--   HAVING d.monto_pagado <> LEAST(COALESCE(SUM(p.monto), 0), d.monto_total);
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.trg_deuda_calcular_pagado()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pagado DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(monto), 0) INTO v_pagado
  FROM public.pagos
  WHERE deuda_id = NEW.id;

  -- Se topea en monto_total para que el saldo nunca sea negativo
  -- (el front ya impide pagar de más).
  NEW.monto_pagado := LEAST(v_pagado, NEW.monto_total);
  NEW.estado := CASE
    WHEN v_pagado >= NEW.monto_total THEN 'pagada'
    WHEN v_pagado > 0 THEN 'parcial'
    ELSE 'pendiente'
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pago_recalcular_deuda()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- El UPDATE "vacío" dispara trg_deuda_calcular_pagado, que hace la cuenta.
  IF TG_OP <> 'INSERT' AND OLD.deuda_id IS NOT NULL THEN
    UPDATE public.deudas SET monto_pagado = monto_pagado WHERE id = OLD.deuda_id;
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.deuda_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.deuda_id IS DISTINCT FROM OLD.deuda_id) THEN
    UPDATE public.deudas SET monto_pagado = monto_pagado WHERE id = NEW.deuda_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_deuda_calcular_pagado ON public.deudas;
CREATE TRIGGER trg_deuda_calcular_pagado
  BEFORE INSERT OR UPDATE ON public.deudas
  FOR EACH ROW EXECUTE FUNCTION public.trg_deuda_calcular_pagado();

DROP TRIGGER IF EXISTS trg_pago_recalcular_deuda ON public.pagos;
CREATE TRIGGER trg_pago_recalcular_deuda
  AFTER INSERT OR UPDATE OR DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.trg_pago_recalcular_deuda();

-- Recalcular todas las deudas existentes una vez.
UPDATE public.deudas SET monto_pagado = monto_pagado;
