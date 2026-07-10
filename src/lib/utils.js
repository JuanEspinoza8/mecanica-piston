import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza texto para búsquedas tolerantes: pasa a minúsculas y elimina
 * acentos/diacríticos. Así "José" y "jose" quedan iguales.
 */
export function normalizeText(str) {
  return (str ?? '')
    .toString()
    .normalize('NFD')                  // separa letra + acento (é -> e + ´)
    .replace(/[̀-ͯ]/g, '')   // elimina los diacríticos combinantes
    .toLowerCase()
    .trim();
}

/**
 * Devuelve true si `query` coincide con `haystack` de forma tolerante a
 * acentos, mayúsculas, espacios/puntuación y orden de las palabras.
 *
 * - Compara una versión "compacta" (solo alfanuméricos) para que patentes y
 *   teléfonos matcheen con o sin espacios/guiones. Ej: "ab123cd" ↔ "AB 123 CD".
 * - Si no, exige que cada palabra de la búsqueda esté presente en cualquier
 *   orden. Ej: "espinoza juan" encuentra a "Juan Espinoza".
 */
export function matchesSearch(haystack, query) {
  const nQuery = normalizeText(query);
  if (!nQuery) return true;

  const nHay = normalizeText(haystack);
  const compactHay = nHay.replace(/[^a-z0-9]/g, '');
  const compactQuery = nQuery.replace(/[^a-z0-9]/g, '');

  if (compactQuery && compactHay.includes(compactQuery)) return true;

  const tokens = nQuery.split(/\s+/).filter(Boolean);
  return tokens.every(t => nHay.includes(t));
}
