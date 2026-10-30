-- ==============================================================================
-- 005 — Pasar los buckets a privados
--
-- Cuándo: DESPUÉS de desplegar el front que usa URLs firmadas y de que los
-- dispositivos del taller hayan cargado la versión nueva (se ve en la versión
-- que aparece abajo del menú lateral). Una versión vieja de la PWA que siga
-- abierta mostraría imágenes y comprobantes rotos hasta recargar.
--
-- Requiere la 002 (políticas de lectura sobre storage.objects): sin ellas
-- createSignedUrl devuelve error.
--
-- Equivale a Storage → bucket → Edit bucket → desmarcar "Public bucket".
-- Para volver atrás: el mismo UPDATE con public = true.
-- ==============================================================================

UPDATE storage.buckets
SET public = false
WHERE id IN ('archivos', 'archivos_pagos');

-- Verificación: las dos filas tienen que tener public = false.
SELECT id, public FROM storage.buckets WHERE id IN ('archivos', 'archivos_pagos');
