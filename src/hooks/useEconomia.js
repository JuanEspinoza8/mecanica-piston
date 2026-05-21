import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCachedData, isOnline } from '../db/offlineService';

export function useEconomia() {
  return useQuery({
    queryKey: ['economia'],
    queryFn: async () => {
      if (!isOnline()) {
        const [pagos, deudas, repuestos] = await Promise.all([
          getCachedData('pagos'),
          getCachedData('deudas'),
          getCachedData('repuestos'),
        ]);
        return buildEconomiaData(pagos, deudas, repuestos, new Date());
      }

      try {
        const now = new Date();
        const hace12Meses = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString();

        const [
          { data: pagos },
          { data: deudas },
          { data: repuestos },
        ] = await Promise.all([
          supabase.from('pagos').select('monto, metodo_pago, fecha, created_at')
            .gte('fecha', hace12Meses).order('fecha', { ascending: true }),
          supabase.from('deudas').select('monto_total, monto_pagado, estado, en_cuotas, cantidad_cuotas, created_at, cliente_id, clientes(nombre, apellido)'),
          supabase.from('repuestos').select('costo, cantidad, created_at')
            .gte('created_at', hace12Meses),
        ]);

        return buildEconomiaData(pagos || [], deudas || [], repuestos || [], now);
      } catch (err) {
        if (!isOnline()) {
          // Fallback offline: construir desde cache
          const [pagos, deudas, repuestos] = await Promise.all([
            getCachedData('pagos'),
            getCachedData('deudas'),
            getCachedData('repuestos'),
          ]);
          return buildEconomiaData(pagos, deudas, repuestos, new Date());
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

/**
 * Construye el objeto de datos de economía a partir de arrays de datos.
 * Reutilizable tanto para datos online como offline.
 */
function buildEconomiaData(pagos, deudas, repuestos, now) {
  // --- Ingresos por mes ---
  const ingresosPorMes = {};
  pagos.forEach(p => {
    const mes = (p.fecha || p.created_at || '').substring(0, 7);
    if (mes) ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + Number(p.monto);
  });

  // --- Costo repuestos por mes ---
  const costosPorMes = {};
  repuestos.forEach(r => {
    const mes = (r.created_at || '').substring(0, 7);
    if (mes) costosPorMes[mes] = (costosPorMes[mes] || 0) + (Number(r.costo) * Number(r.cantidad));
  });

  // --- Deudas creadas por mes ---
  const deudasPorMes = {};
  deudas.forEach(d => {
    const mes = (d.created_at || '').substring(0, 7);
    if (mes) deudasPorMes[mes] = (deudasPorMes[mes] || 0) + Number(d.monto_total);
  });

  // Generar últimos 12 meses
  const meses = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    meses.push({
      key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      ingresos: ingresosPorMes[key] || 0,
      costos: costosPorMes[key] || 0,
      neto: (ingresosPorMes[key] || 0) - (costosPorMes[key] || 0),
      deudas: deudasPorMes[key] || 0,
    });
  }

  // --- Totales ---
  const totalIngresos = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const totalCostos = repuestos.reduce((s, r) => s + Number(r.costo) * Number(r.cantidad), 0);
  const deudaTotal = deudas
    .filter(d => d.estado !== 'pagada')
    .reduce((s, d) => s + (Number(d.monto_total) - Number(d.monto_pagado)), 0);

  // --- Proyección de ingresos (cuotas pendientes) ---
  const proyeccion = [];
  const deudasConCuotas = deudas.filter(d => d.en_cuotas && d.estado !== 'pagada');
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    let ingresoProy = 0;
    deudasConCuotas.forEach(deuda => {
      const valorCuota = Number(deuda.monto_total) / deuda.cantidad_cuotas;
      const cuotasPagadas = Math.floor(Number(deuda.monto_pagado) / valorCuota);
      const cuotasRestantes = deuda.cantidad_cuotas - cuotasPagadas;
      if (cuotasRestantes > i) {
        ingresoProy += valorCuota;
      }
    });
    proyeccion.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      proyectado: ingresoProy,
    });
  }

  // --- Distribución por método de pago ---
  const metodos = {};
  pagos.forEach(p => {
    if (p.metodo_pago) metodos[p.metodo_pago] = (metodos[p.metodo_pago] || 0) + Number(p.monto);
  });
  const distribucionMetodos = Object.entries(metodos).map(([name, value]) => ({ name, value }));

  // --- Top clientes con deuda ---
  const clienteDeuda = {};
  deudas.filter(d => d.estado !== 'pagada').forEach(d => {
    const clave = d.cliente_id;
    if (!clienteDeuda[clave]) {
      clienteDeuda[clave] = {
        nombre: d.clientes ? `${d.clientes.nombre} ${d.clientes.apellido || ''}`.trim() : 'Desconocido',
        deuda: 0,
        deudasCount: 0,
      };
    }
    clienteDeuda[clave].deuda += Number(d.monto_total) - Number(d.monto_pagado);
    clienteDeuda[clave].deudasCount += 1;
  });
  const topClientes = Object.values(clienteDeuda)
    .sort((a, b) => b.deuda - a.deuda)
    .slice(0, 10);

  return {
    meses,
    totalIngresos,
    totalCostos,
    gananciaNeta: totalIngresos - totalCostos,
    deudaTotal,
    proyeccion,
    distribucionMetodos,
    topClientes,
  };
}
