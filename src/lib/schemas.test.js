import { describe, it, expect } from 'vitest';
import { clienteSchema, deudaSchema, ordenSchema, pagoSchema, vehiculoSchema } from './schemas';

const primerError = (resultado) => resultado.error.issues[0].message;

describe('vehiculoSchema: normalización de patentes', () => {
  const vehiculo = (patente) => ({ patente, marca: 'Ford', modelo: 'Fiesta', año: 2015, clienteId: 'c1' });

  it.each([
    ['ab123cd', 'AB 123 CD'],
    ['AB 123 CD', 'AB 123 CD'],
    ['  ab 123  cd ', 'AB 123 CD'],
    ['abc123', 'ABC 123'],
    ['ABC 123', 'ABC 123'],
  ])('"%s" se guarda como "%s"', (entrada, esperada) => {
    const resultado = vehiculoSchema.safeParse(vehiculo(entrada));
    expect(resultado.success).toBe(true);
    expect(resultado.data.patente).toBe(esperada);
  });

  it.each(['AB12CD', '123ABC', 'ABCD123', 'AB 123 C1'])('rechaza "%s"', (patente) => {
    const resultado = vehiculoSchema.safeParse(vehiculo(patente));
    expect(resultado.success).toBe(false);
    expect(primerError(resultado)).toMatch(/patente|Formato inválido/);
  });

  it('acepta el año como texto (input del formulario)', () => {
    const resultado = vehiculoSchema.safeParse({ ...vehiculo('AB123CD'), año: '2015' });
    expect(resultado.data.año).toBe(2015);
  });
});

describe('pagoSchema', () => {
  const pago = (extra) => ({ monto: '1.500', fecha: '2026-10-30', metodo: 'Efectivo', ...extra });

  it('convierte montos con separador de miles y coma decimal', () => {
    expect(pagoSchema.parse(pago({ monto: '1.500' })).monto).toBe(1500);
    expect(pagoSchema.parse(pago({ monto: '12.345,50' })).monto).toBe(12345.5);
    expect(pagoSchema.parse(pago({ monto: 800 })).monto).toBe(800);
  });

  it('rechaza montos vacíos o en cero', () => {
    expect(primerError(pagoSchema.safeParse(pago({ monto: '' })))).toBe('El monto debe ser mayor a 0');
    expect(pagoSchema.safeParse(pago({ monto: '0' })).success).toBe(false);
  });

  it('muestra el mensaje propio para un método de pago inválido (Zod 4: opción error)', () => {
    const resultado = pagoSchema.safeParse(pago({ metodo: 'Cheque' }));
    expect(primerError(resultado)).toBe('Seleccione un método de pago válido');
  });
});

describe('ordenSchema', () => {
  const orden = (extra) => ({ clienteId: 'c1', vehiculoId: 'v1', sintoma: 'Ruido en el tren delantero', ...extra });

  it('exige una descripción de al menos 10 caracteres', () => {
    expect(primerError(ordenSchema.safeParse(orden({ sintoma: 'Ruido' })))).toMatch(/mínimo 10/);
  });

  it('muestra el mensaje propio para un estado inválido', () => {
    expect(primerError(ordenSchema.safeParse(orden({ estado: 'Cancelada' })))).toBe('Seleccione un estado válido');
  });
});

describe('clienteSchema', () => {
  it('acepta nombres con acentos y teléfonos con símbolos comunes', () => {
    const resultado = clienteSchema.safeParse({ nombre: 'José Ñandú', telefono: '+54 (298) 412-3456' });
    expect(resultado.success).toBe(true);
  });

  it('rechaza nombres con números', () => {
    expect(primerError(clienteSchema.safeParse({ nombre: 'Juan2', telefono: '29841234' }))).toMatch(/solo puede contener letras/);
  });
});

describe('deudaSchema', () => {
  it('aplica los valores por defecto de cuotas', () => {
    const deuda = deudaSchema.parse({ concepto: 'Reparación', monto_total: '25.000' });
    expect(deuda).toMatchObject({ monto_total: 25000, en_cuotas: false, cantidad_cuotas: 1 });
  });
});
