import { z } from 'zod';

// Esquema de validación para Clientes
export const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe ser válido (ej: 11 1234-5678)'),
  email: z.string().email('El correo electrónico no es válido').optional().or(z.literal('')),
  direccion: z.string().optional(),
});

// Esquema de validación para Órdenes
export const ordenSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  vehiculoId: z.string().min(1, 'Debe seleccionar un vehículo'),
  sintoma: z.string().min(10, 'Por favor describa el problema con más detalle (mínimo 10 caracteres)'),
});

// Esquema de validación para Vehículos
export const vehiculoSchema = z.object({
  patente: z.string().min(6, 'La patente debe tener al menos 6 caracteres').max(8, 'Patente muy larga'),
  marca: z.string().min(2, 'La marca es obligatoria'),
  modelo: z.string().min(2, 'El modelo es obligatorio'),
  año: z.coerce.number().min(1950, 'Año inválido').max(new Date().getFullYear() + 1, 'Año inválido'),
  color: z.string().optional(),
  clienteId: z.string().min(1, 'Debe asignar el vehículo a un cliente'),
});
