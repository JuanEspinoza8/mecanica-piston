import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getCachedData, isOnline } from '../db/offlineService';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      if (!isOnline()) {
        const [clientes, ordenes, deudas, pagos] = await Promise.all([
          getCachedData('clientes'),
          getCachedData('ordenes_trabajo'),
          getCachedData('deudas'),
          getCachedData('pagos'),
        ]);

        const ordenesAbiertas = ordenes.filter(o => o.estado !== 'Terminado' && o.estado !== 'Entregado');
        const vehiculosUnicos = new Set(ordenesAbiertas.map(o => o.vehiculo_id));
        const deudasPend = deudas.filter(d => d.estado === 'pendiente' || d.estado === 'parcial');
        const deudaTotal = deudasPend.reduce((s, d) => s + (Number(d.monto_total || 0) - Number(d.monto_pagado || 0)), 0);

        const now = new Date();
        const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const pagosMes = pagos.filter(p => p.fecha >= mesInicio);
        const ingresoMesBruto = pagosMes.reduce((s, p) => s + Number(p.monto || 0), 0);

        return {
          ordenesActivas: ordenesAbiertas.length,
          vehiculosEnTaller: vehiculosUnicos.size,
          totalClientes: clientes.length,
          ultimasOrdenes: ordenesAbiertas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
          ordenesEspera: ordenes.filter(o => o.estado === 'Esperando repuesto'),
          deudaTotal,
          ingresoMesBruto,
          ingresoMesNeto: ingresoMesBruto,
        };
      }

      try {
        const now = new Date();
        const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [
          { count: ordenesActivas },
          { count: totalClientes },
          { data: ultimasOrdenes },
          { data: ordenesEspera },
          { data: deudasPendientes },
          { data: pagosMes },
          { data: repuestosMes },
        ] = await Promise.all([
          supabase.from('ordenes_trabajo').select('*', { count: 'exact', head: true })
            .not('estado', 'in', '("Terminado","Entregado")'),

          supabase.from('clientes').select('*', { count: 'exact', head: true }),

          supabase.from('ordenes_trabajo').select(`
            id, descripcion, estado, fecha_ingreso, created_at,
            vehiculos (id, patente, marca, modelo, clientes (id, nombre, apellido))
          `).not('estado', 'in', '("Terminado","Entregado")').order('created_at', { ascending: false }).limit(5),

          supabase.from('ordenes_trabajo').select(`
            id, descripcion, motivo_espera, created_at,
            vehiculos (id, patente, marca, modelo, clientes (nombre, apellido))
          `).eq('estado', 'Esperando repuesto').order('created_at', { ascending: false }),

          // Deuda total pendiente
          supabase.from('deudas').select('monto_total, monto_pagado')
            .in('estado', ['pendiente', 'parcial']),

          // Pagos del mes actual
          supabase.from('pagos').select('monto').gte('fecha', mesInicio),

          // Repuestos del mes actual (para calcular ingreso neto)
          supabase.from('repuestos').select('costo, cantidad').gte('created_at', mesInicio),
        ]);

        // Vehículos en taller
        const { data: vehiculosEnTaller } = await supabase
          .from('ordenes_trabajo').select('vehiculo_id')
          .not('estado', 'in', '("Terminado","Entregado")');
        const vehiculosUnicos = new Set(vehiculosEnTaller?.map(o => o.vehiculo_id) || []);

        // Cálculos financieros
        const deudaTotal = (deudasPendientes || []).reduce(
          (sum, d) => sum + (Number(d.monto_total) - Number(d.monto_pagado)), 0
        );

        const ingresoMesBruto = (pagosMes || []).reduce(
          (sum, p) => sum + Number(p.monto), 0
        );

        const costoRepuestosMes = (repuestosMes || []).reduce(
          (sum, r) => sum + (Number(r.costo) * Number(r.cantidad)), 0
        );

        return {
          ordenesActivas: ordenesActivas || 0,
          vehiculosEnTaller: vehiculosUnicos.size,
          totalClientes: totalClientes || 0,
          ultimasOrdenes: ultimasOrdenes || [],
          ordenesEspera: ordenesEspera || [],
          deudaTotal,
          ingresoMesBruto,
          ingresoMesNeto: ingresoMesBruto - costoRepuestosMes,
        };
      } catch (err) {
        // Fallback robusto
        const [clientes, ordenes, deudas, pagos] = await Promise.all([
          getCachedData('clientes'),
          getCachedData('ordenes_trabajo'),
          getCachedData('deudas'),
          getCachedData('pagos'),
        ]);

        const ordenesAbiertas = ordenes.filter(o => o.estado !== 'Terminado' && o.estado !== 'Entregado');
        const vehiculosUnicos = new Set(ordenesAbiertas.map(o => o.vehiculo_id));
        const deudasPend = deudas.filter(d => d.estado === 'pendiente' || d.estado === 'parcial');
        const deudaTotal = deudasPend.reduce((s, d) => s + (Number(d.monto_total || 0) - Number(d.monto_pagado || 0)), 0);

        const now = new Date();
        const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const pagosMes = pagos.filter(p => p.fecha >= mesInicio);
        const ingresoMesBruto = pagosMes.reduce((s, p) => s + Number(p.monto || 0), 0);

        return {
          ordenesActivas: ordenesAbiertas.length,
          vehiculosEnTaller: vehiculosUnicos.size,
          totalClientes: clientes.length,
          ultimasOrdenes: ordenesAbiertas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
          ordenesEspera: ordenes.filter(o => o.estado === 'Esperando repuesto'),
          deudaTotal,
          ingresoMesBruto,
          ingresoMesNeto: ingresoMesBruto,
        };
      }
    },
    staleTime: 1000 * 60,
  });
}
