-- Supabase Schema para Mecánica Pistón
--
-- Crea la base completa desde cero, ya en el estado final (políticas RLS,
-- buckets privados, triggers). Para una base que ya está en producción NO uses
-- este archivo: aplicá las migraciones de supabase/migrations en orden
-- (ver README → "Base de datos").

-- ==============================================================================
-- ⚠️ PELIGRO: ESTAS LÍNEAS BORRAN TODAS LAS TABLAS EXISTENTES.
-- Usar solo para inicializar o hacer hard-reset de la base de datos.
-- ==============================================================================
DROP FUNCTION IF EXISTS public.get_saldo_cliente(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.trg_deuda_calcular_pagado() CASCADE;
DROP FUNCTION IF EXISTS public.trg_pago_recalcular_deuda() CASCADE;

DROP TABLE IF EXISTS public.archivos CASCADE;
DROP TABLE IF EXISTS public.historial_modificaciones CASCADE;
DROP TABLE IF EXISTS public.notas CASCADE;
DROP TABLE IF EXISTS public.pagos CASCADE;
DROP TABLE IF EXISTS public.deudas CASCADE;
DROP TABLE IF EXISTS public.repuestos CASCADE;
DROP TABLE IF EXISTS public.ordenes_trabajo CASCADE;
DROP TABLE IF EXISTS public.vehiculos CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.tareas_orden CASCADE;

-- ==============================================================================
-- CREACIÓN DE TABLAS
-- ==============================================================================

-- Tabla de Clientes
CREATE TABLE public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Vehículos
CREATE TABLE public.vehiculos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    patente TEXT NOT NULL UNIQUE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    anio INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Órdenes de Trabajo
CREATE TABLE public.ordenes_trabajo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    diagnostico TEXT,
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_egreso TIMESTAMP WITH TIME ZONE,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En proceso', 'Esperando repuesto', 'Terminado', 'Entregado')),
    motivo_espera TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tareas de Orden (Checklist)
CREATE TABLE public.tareas_orden (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En proceso', 'Terminado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Repuestos
CREATE TABLE public.repuestos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    costo DECIMAL(10, 2) NOT NULL CHECK (costo >= 0),
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Deudas
CREATE TABLE public.deudas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    orden_id UUID REFERENCES public.ordenes_trabajo(id) ON DELETE SET NULL,
    concepto TEXT NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL CHECK (monto_total > 0),
    monto_pagado DECIMAL(10, 2) DEFAULT 0 CHECK (monto_pagado >= 0),
    en_cuotas BOOLEAN DEFAULT FALSE,
    cantidad_cuotas INTEGER DEFAULT 1 CHECK (cantidad_cuotas >= 1),
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Pagos
CREATE TABLE public.pagos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    deuda_id UUID REFERENCES public.deudas(id) ON DELETE SET NULL,
    orden_id UUID REFERENCES public.ordenes_trabajo(id) ON DELETE SET NULL,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Mercado Pago', 'Transferencia', 'Tarjeta')),
    comprobante_url TEXT,
    nota TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Notas Rápidas (Flashcards)
CREATE TABLE public.notas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    texto TEXT NOT NULL,
    completada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Historial de Modificaciones
CREATE TABLE public.historial_modificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
    tipo_accion TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Archivos
CREATE TABLE public.archivos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
    nombre_archivo TEXT NOT NULL,
    ruta_storage TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('imagen', 'documento')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- FUNCIONES RPC
-- ==============================================================================

-- Función para obtener el saldo de un cliente (basada en deudas).
-- SECURITY INVOKER: respeta RLS, así que solo devuelve datos a quien puede verlos.
CREATE OR REPLACE FUNCTION public.get_saldo_cliente(p_cliente_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    -- Saldo = suma de (monto_total - monto_pagado) de deudas no pagadas
    RETURN COALESCE((
        SELECT SUM(monto_total - monto_pagado)
        FROM public.deudas
        WHERE cliente_id = p_cliente_id
          AND estado != 'pagada'
    ), 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_saldo_cliente(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_saldo_cliente(UUID) TO authenticated;

-- ==============================================================================
-- SEGURIDAD Y RLS
--
-- Solo usuarios con sesión acceden a los datos. Requisito: el registro público
-- tiene que estar deshabilitado (Authentication → Sign In / Providers →
-- "Allow new users to sign up"). Para restringir además a una lista de
-- usuarios, ver supabase/migrations/006_usuarios_autorizados.sql.
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
    EXECUTE format(
      'CREATE POLICY "Acceso autenticado" ON public.%I
         FOR ALL TO authenticated
         USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- ==============================================================================
-- STORAGE
--
-- Buckets privados: el front pide URLs firmadas (createSignedUrl), así que un
-- comprobante o una foto no se abren sin sesión aunque alguien tenga el link.
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos', 'archivos', false), ('archivos_pagos', 'archivos_pagos', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

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

-- ==============================================================================
-- TRIGGERS PARA HISTORIAL DE MODIFICACIONES
-- ==============================================================================

-- Función: registrar creación de orden
CREATE OR REPLACE FUNCTION public.trg_historial_orden_creada()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.historial_modificaciones (vehiculo_id, tipo_accion, descripcion)
  VALUES (
    NEW.vehiculo_id,
    'Orden creada',
    'Se creó una nueva orden de trabajo: ' || COALESCE(LEFT(NEW.descripcion, 80), 'Sin descripción')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: registrar cambio de estado de orden
CREATE OR REPLACE FUNCTION public.trg_historial_orden_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.historial_modificaciones (vehiculo_id, tipo_accion, descripcion)
    VALUES (
      NEW.vehiculo_id,
      CASE
        WHEN NEW.estado IN ('Terminado', 'Entregado') THEN 'Orden completada'
        WHEN NEW.estado = 'Esperando repuesto' THEN 'Orden en espera de repuesto'
        ELSE 'Estado cambiado a ' || NEW.estado
      END,
      'El estado de la orden pasó de "' || OLD.estado || '" a "' || NEW.estado || '"'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: registrar agregado de repuesto
CREATE OR REPLACE FUNCTION public.trg_historial_repuesto_agregado()
RETURNS TRIGGER AS $$
DECLARE
  v_vehiculo_id UUID;
BEGIN
  SELECT vehiculo_id INTO v_vehiculo_id FROM public.ordenes_trabajo WHERE id = NEW.orden_id;
  INSERT INTO public.historial_modificaciones (vehiculo_id, tipo_accion, descripcion)
  VALUES (
    v_vehiculo_id,
    'Repuesto agregado',
    'Se agregó el repuesto "' || NEW.nombre || '" (x' || NEW.cantidad || ') — $' || NEW.costo
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función: registrar eliminación de repuesto
CREATE OR REPLACE FUNCTION public.trg_historial_repuesto_eliminado()
RETURNS TRIGGER AS $$
DECLARE
  v_vehiculo_id UUID;
BEGIN
  SELECT vehiculo_id INTO v_vehiculo_id FROM public.ordenes_trabajo WHERE id = OLD.orden_id;
  INSERT INTO public.historial_modificaciones (vehiculo_id, tipo_accion, descripcion)
  VALUES (
    v_vehiculo_id,
    'Repuesto eliminado',
    'Se eliminó el repuesto "' || OLD.nombre || '"'
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear los triggers
DROP TRIGGER IF EXISTS trg_orden_creada ON public.ordenes_trabajo;
CREATE TRIGGER trg_orden_creada
  AFTER INSERT ON public.ordenes_trabajo
  FOR EACH ROW EXECUTE FUNCTION public.trg_historial_orden_creada();

DROP TRIGGER IF EXISTS trg_orden_estado ON public.ordenes_trabajo;
CREATE TRIGGER trg_orden_estado
  AFTER UPDATE ON public.ordenes_trabajo
  FOR EACH ROW EXECUTE FUNCTION public.trg_historial_orden_estado();

DROP TRIGGER IF EXISTS trg_repuesto_agregado ON public.repuestos;
CREATE TRIGGER trg_repuesto_agregado
  AFTER INSERT ON public.repuestos
  FOR EACH ROW EXECUTE FUNCTION public.trg_historial_repuesto_agregado();

DROP TRIGGER IF EXISTS trg_repuesto_eliminado ON public.repuestos;
CREATE TRIGGER trg_repuesto_eliminado
  AFTER DELETE ON public.repuestos
  FOR EACH ROW EXECUTE FUNCTION public.trg_historial_repuesto_eliminado();

-- ==============================================================================
-- DEUDAS: monto_pagado y estado se calculan desde la tabla pagos
--
-- El cliente nunca escribe monto_pagado: si lo manda, se ignora. Así dos
-- dispositivos (o un pago encolado offline) no se pisan entre sí.
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
