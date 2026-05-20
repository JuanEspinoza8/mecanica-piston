import { z } from 'zod';

// Esquema de validación para Clientes
export const clienteSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/, 'El nombre solo puede contener letras'),
  apellido: z.string()
    .max(100, 'El apellido es demasiado largo')
    .regex(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/, 'El apellido solo puede contener letras')
    .optional()
    .or(z.literal('')),
  telefono: z.string()
    .min(8, 'El teléfono debe tener al menos 8 dígitos')
    .max(20, 'Teléfono demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Formato de teléfono inválido'),
  email: z.string()
    .email('El correo electrónico no es válido')
    .optional()
    .or(z.literal('')),
  direccion: z.string().max(200, 'Dirección demasiado larga').optional(),
});

// Esquema de validación para Órdenes
export const ordenSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  vehiculoId: z.string().min(1, 'Debe seleccionar un vehículo'),
  sintoma: z.string()
    .min(10, 'Describa el problema con más detalle (mínimo 10 caracteres)')
    .max(500, 'La descripción es demasiado larga'),
  diagnostico: z.string()
    .max(500, 'El diagnóstico es demasiado largo')
    .optional()
    .or(z.literal('')),
  fecha_ingreso: z.string().optional(),
  estado: z.enum(['Pendiente', 'En proceso', 'Esperando repuesto', 'Terminado', 'Entregado'], {
    errorMap: () => ({ message: 'Seleccione un estado válido' })
  }).optional(),
});

// Esquema de validación para Vehículos
export const vehiculoSchema = z.object({
  patente: z.string()
    .min(6, 'La patente debe tener al menos 6 caracteres')
    .max(10, 'Patente demasiado larga')
    .transform(val => {
      // Strip spaces and uppercase
      const clean = val.replace(/\s+/g, '').toUpperCase();
      // Try new format: AA 123 AA
      const newFormat = clean.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
      if (newFormat) return `${newFormat[1]} ${newFormat[2]} ${newFormat[3]}`;
      // Try old format: AAA 123
      const oldFormat = clean.match(/^([A-Z]{3})(\d{3})$/);
      if (oldFormat) return `${oldFormat[1]} ${oldFormat[2]}`;
      // Return as-is for validation to catch
      return clean;
    })
    .refine(
      val => /^([A-Z]{3} \d{3}|[A-Z]{2} \d{3} [A-Z]{2})$/.test(val),
      { message: 'Formato inválido. Usá AAA 123 o AA 123 BB' }
    ),
  marca: z.string().min(2, 'La marca es obligatoria').max(30, 'Marca demasiado larga'),
  modelo: z.string().min(1, 'El modelo es obligatorio').max(50, 'Modelo demasiado largo'),
  año: z.coerce.number()
    .min(1950, 'El año debe ser mayor a 1950')
    .max(new Date().getFullYear() + 1, `El año no puede ser mayor a ${new Date().getFullYear() + 1}`),
  color: z.string().max(30, 'Color demasiado largo').optional(),
  clienteId: z.string().min(1, 'Debe asignar el vehículo a un cliente'),
});

// Esquema de validación para Pagos
export const pagoSchema = z.object({
  deuda_id: z.string().min(1, 'Seleccioná una deuda a pagar').optional().or(z.literal('')),
  monto: z.union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(val.replace(/\./g, '').replace(',', '.'));
    })
    .refine(val => !isNaN(val) && val > 0, { message: 'El monto debe ser mayor a 0' }),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  metodo: z.enum(['Efectivo', 'Mercado Pago', 'Transferencia', 'Tarjeta'], {
    errorMap: () => ({ message: 'Seleccione un método de pago válido' })
  }),
  nota: z.string().max(200, 'La nota es demasiado larga').optional(),
});

// Esquema de validación para Deudas
export const deudaSchema = z.object({
  concepto: z.string()
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(200, 'El concepto es demasiado largo'),
  monto_total: z.union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      return Number(val.replace(/\./g, '').replace(',', '.'));
    })
    .refine(val => !isNaN(val) && val > 0, { message: 'El monto debe ser mayor a 0' }),
  en_cuotas: z.boolean().default(false),
  cantidad_cuotas: z.coerce.number().min(1, 'Mínimo 1 cuota').max(48, 'Máximo 48 cuotas').default(1),
});
