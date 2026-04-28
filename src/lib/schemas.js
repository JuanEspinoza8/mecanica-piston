import { z } from 'zod';

// Esquema de validación para Clientes
export const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe ser válido (ej: 11 1234-5678)'),
  email: z.string().email('El correo electrónico no es válido').optional().or(z.literal('')),
  direccion: z.string().optional(),
});
