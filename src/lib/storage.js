import { supabase } from './supabase';

export const BUCKET_ARCHIVOS = 'archivos';
export const BUCKET_COMPROBANTES = 'archivos_pagos';

// Las URLs firmadas vencen a las 2 horas. Las queries que las generan se
// marcan como viejas a los 30 minutos (SIGNED_URL_STALE_TIME), así que al
// volver a la pantalla o al foco se piden URLs nuevas mucho antes de que venzan.
// Offline se usa la última URL generada: el service worker guarda las imágenes
// sin el parámetro `token` (ver vite.config.js), así que la sirve desde su caché
// aunque esté vencida.
export const SIGNED_URL_TTL = 60 * 60 * 2;
export const SIGNED_URL_STALE_TIME = 30 * 60 * 1000;

/**
 * Devuelve la ruta dentro del bucket de comprobantes. Los pagos viejos guardaban
 * la URL pública completa; los nuevos guardan solo la ruta.
 */
export function comprobantePath(valor) {
  if (!valor) return null;
  const marca = `/object/public/${BUCKET_COMPROBANTES}/`;
  const i = valor.indexOf(marca);
  if (i === -1) return valor;
  return decodeURIComponent(valor.slice(i + marca.length).split('?')[0]);
}

/**
 * Genera URLs firmadas para varias rutas de un bucket en una sola llamada.
 * Si falla, devuelve un objeto vacío: la pantalla sigue mostrando los datos
 * aunque sin vista previa.
 * @returns {Promise<Record<string, string>>} ruta → URL firmada
 */
export async function getSignedUrls(bucket, paths) {
  const unicas = [...new Set(paths.filter(Boolean))];
  if (unicas.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unicas, SIGNED_URL_TTL);

  if (error) {
    console.warn(`[Storage] No se pudieron firmar las URLs de ${bucket}:`, error);
    return {};
  }

  return Object.fromEntries(
    data.filter(item => item.signedUrl).map(item => [item.path, item.signedUrl])
  );
}
