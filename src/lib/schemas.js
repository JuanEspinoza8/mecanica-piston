import { z } from 'zod';

// Esquema de validación para Clientes
export const clienteSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo')
    .regex(/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/, 'El nombre solo puede contener letras'),
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
});

// Esquema de validación para Vehículos
export const vehiculoSchema = z.object({
  patente: z.string()
    .min(6, 'La patente debe tener al menos 6 caracteres')
    .max(10, 'Patente demasiado larga')
    .regex(
      /^([A-Za-z]{3}\s?\d{3}|[A-Za-z]{2}\s?\d{3}\s?[A-Za-z]{2})$/,
      'Formato inválido. Usá AAA 123 o AA 123 BB'
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
  monto: z.union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      // Remueve puntos (miles en AR) y cambia coma por punto decimal
      return Number(val.replace(/\./g, '').replace(',', '.'));
    })
    .refine(val => !isNaN(val) && val > 0, { message: 'El monto debe ser mayor a 0' }),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  metodo: z.enum(['Efectivo', 'Mercado Pago', 'Transferencia', 'Tarjeta'], {
    errorMap: () => ({ message: 'Seleccione un método de pago válido' })
  }),
  es_cuota: z.boolean().default(false),
  cuota_actual: z.coerce.number().min(1, 'Mínimo 1').optional().or(z.literal('')),
  total_cuotas: z.coerce.number().min(2, 'Mínimo 2').optional().or(z.literal('')),
  nota: z.string().max(200, 'La nota es demasiado larga').optional(),
});
