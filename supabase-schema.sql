-- Supabase Schema para Mecánica Pistón

-- ==============================================================================
-- ⚠️ PELIGRO: ESTAS LÍNEAS BORRAN TODAS LAS TABLAS EXISTENTES.
-- Usar solo para inicializar o hacer hard-reset de la base de datos.
-- ==============================================================================
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.clientes;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.vehiculos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.ordenes_trabajo;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.repuestos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.pagos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.notas;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.historial_modificaciones;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.archivos;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.tareas_orden;
DROP POLICY IF EXISTS "Permitir todo a todos temporalmente" ON public.deudas;

DROP FUNCTION IF EXISTS public.get_saldo_cliente(UUID) CASCADE;

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

-- Función para obtener el saldo de un cliente (basada en deudas)
CREATE OR REPLACE FUNCTION public.get_saldo_cliente(p_cliente_id UUID)
RETURNS DECIMAL AS $$
BEGIN
    -- Saldo = suma de (monto_total - monto_pagado) de deudas no pagadas
    RETURN COALESCE((
        SELECT SUM(monto_total - monto_pagado)
        FROM public.deudas
        WHERE cliente_id = p_cliente_id
          AND estado != 'pagada'
    ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- SEGURIDAD Y RLS
-- ==============================================================================

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_modificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos ENABLE ROW LEVEL SECURITY;

-- Políticas temporales (Permitir todo para desarrollo, luego se ajustará con Auth)
CREATE POLICY "Permitir todo a todos temporalmente" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.vehiculos FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.ordenes_trabajo FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.repuestos FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.tareas_orden FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.pagos FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.deudas FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.notas FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.historial_modificaciones FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.archivos FOR ALL USING (true);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
