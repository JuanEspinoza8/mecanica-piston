-- Supabase Schema para Mecánica Pistón

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
    estado TEXT DEFAULT 'Abierta' CHECK (estado IN ('Abierta', 'En Proceso', 'Cerrada')),
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

-- Tabla de Pagos
CREATE TABLE public.pagos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    orden_id UUID REFERENCES public.ordenes_trabajo(id) ON DELETE SET NULL,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Mercado Pago', 'Transferencia', 'Tarjeta')),
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

-- Configuración de Seguridad y RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_modificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos ENABLE ROW LEVEL SECURITY;

-- Políticas temporales (Permitir todo para desarrollo, luego se ajustará con Auth)
CREATE POLICY "Permitir todo a todos temporalmente" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.vehiculos FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.ordenes_trabajo FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.repuestos FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.pagos FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.notas FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.historial_modificaciones FOR ALL USING (true);
CREATE POLICY "Permitir todo a todos temporalmente" ON public.archivos FOR ALL USING (true);
