# 📋 Especificación del Proyecto — Mecánica Pistón

> Documento interno de diseño y planificación del sistema de gestión para taller mecánico.

---

## 1. Requerimientos del Cliente

### 1.1 Módulo de Búsqueda Unificada

| Funcionalidad | Descripción |
|---|---|
| **Buscador Global** | Barra de búsqueda principal que permite localizar información ingresando: **Patente**, **Modelo del vehículo**, **Teléfono** o **Nombre/Apellido** del cliente. |
| **Resultados Dinámicos** | Al buscar, el sistema redirige a la ficha del vehículo o del cliente según la coincidencia encontrada. |

### 1.2 Módulo de Gestión de Clientes y Vehículos

- **Registro de Clientes:** Alta, baja y modificación de datos personales (nombre, teléfono, email, dirección).
- **Registro de Vehículos:** Alta de unidades asociadas a un cliente (mínimo: patente, marca, modelo).
- **Relación Cliente-Vehículo:** Un cliente puede tener múltiples vehículos asociados a su perfil (`1:N`).

### 1.3 Módulo de Órdenes de Trabajo (Bitácora)

- **Registro de Tareas:** Espacio para anotar detalladamente cambios, reparaciones o diagnósticos realizados.
- **Gestión de Repuestos:** Asentar repuestos comprados o utilizados, incluyendo nombre de la pieza y costo.
- **Archivos Multimedia:**
  - 📸 Subida de **fotos** (documentar estado del vehículo, piezas dañadas).
  - 📄 Subida de **documentos** (presupuestos en PDF, facturas de terceros).

### 1.4 Módulo Financiero y de Cobranza

- **Estado de Cuenta:** Panel que calcula automáticamente la deuda de cada cliente (trabajos realizados − pagos entregados).
- **Registro de Pagos:** Formulario para asentar cobros totales o parciales (señas).
- **Métodos de Pago:** Selector para registrar la forma de pago (Efectivo, Mercado Pago, Transferencia, Tarjeta de Crédito/Débito).

### 1.5 Módulo de Notas Rápidas (Flashcards)

- **Notas del Día:** Panel de notas rápidas tipo flashcard para anotar tareas, recordatorios o pendientes del día.
- **Tachar/Descartar:** Cada nota se puede marcar como completada (tachada) y descartarla fácilmente.
- **Acceso Rápido:** Las notas son visibles desde el Dashboard para consulta inmediata.

### 1.6 Historial de Modificaciones por Vehículo

- **Registro Automático:** Cada vez que se modifique información de un vehículo u orden de trabajo, se registra automáticamente la fecha, hora y descripción del cambio.
- **Timeline:** Visualización cronológica de todas las modificaciones realizadas sobre un vehículo específico.

### 1.7 Requerimientos No Funcionales

| Requerimiento | Detalle |
|---|---|
| **Diseño Responsivo / PWA** | Interfaz optimizada **Mobile-First** para uso cómodo desde el celular en el taller, funcionando como app móvil. |
| **Almacenamiento de Archivos** | Fotos y documentos almacenados en un servicio de nube/storage, guardando solo la ruta en la base de datos (SQL). |

---

## 2. Stack Tecnológico Propuesto (100% Gratuito)

### 💻 Frontend y UI

| Tecnología | Propósito |
|---|---|
| **React + Vite** | Desarrollo rápido, empaquetado nativo como PWA. |
| **Tailwind CSS** | Diseño Mobile-First, responsivo y liviano. |
| **Shadcn/ui + Lucide** *(opcional)* | Componentes e íconos profesionales listos para usar. |
| **React Router v7** | Navegación entre vistas (búsqueda → cliente → vehículo → orden). |

### 📡 Gestión Offline y Estado Local

| Tecnología | Propósito |
|---|---|
| **Dexie.js** (IndexedDB) | Persistencia local en el navegador para funcionar sin conexión. Sync unidireccional (un solo usuario, sin conflictos). |
| **TanStack Query (React Query)** | Caché de datos del servidor, refetch automático, estados de carga. |
| **Zustand** | Estado local de la UI (sidebar, modales, filtros activos). |

### ☁️ Backend y Base de Datos (BaaS)

| Tecnología | Propósito |
|---|---|
| **Supabase** (PostgreSQL) | Base de datos relacional, autenticación y Storage (1 GB gratis). |
| **Triggers / RPC de Postgres** | Cálculo de saldos en servidor para no sobrecargar el celular. |

### 🧩 Formularios y Validación

| Tecnología | Propósito |
|---|---|
| **React Hook Form** | Manejo performante de formularios (clientes, vehículos, pagos). |
| **Zod** | Validación de datos type-safe en formularios y respuestas de API. |

### 📦 Utilidades

| Tecnología | Propósito |
|---|---|
| **browser-image-compression** | Compresión client-side: reduce fotos de ~5 MB a ~100-200 KB en `.webp` antes de subir. |
| **date-fns** | Manejo y formateo de fechas de ingreso/egreso (liviano, tree-shakeable). |
| **Sonner** | Notificaciones toast livianas ("Pago registrado", "Foto subida", etc). |

### 🚀 Deploy y PWA

| Tecnología | Propósito |
|---|---|
| **vite-plugin-pwa** | Genera automáticamente Service Worker y manifest.json para la PWA. |
| **Vercel o Cloudflare Pages** | Hosting gratuito con deploy automático desde GitHub. |

---

## 3. Alcance Funcional Detallado

### 3.1 Búsqueda Unificada (Optimizada)

- **Buscador Global** en la cabecera de la app.
- **Filtros Inteligentes:** busca coincidencias por patente, modelo del vehículo, teléfono o nombre/apellido.
- **Redirección Directa:** un clic lleva al perfil del cliente o ficha del vehículo.

### 3.2 Gestión de Clientes y Vehículos (Relacional)

- **CRUD de Clientes:** alta, edición y baja de datos de contacto.
- **Ficha del Vehículo:** registro de unidades (patente, marca, modelo, año) vinculadas `1:N` a su dueño.
- **Historial Centralizado:** cada vehículo muestra su propio historial (todas las visitas al taller).

### 3.3 Bitácora y Órdenes de Trabajo

- **Registro Detallado:** tareas realizadas, diagnósticos, fechas de ingreso/egreso.
- **Gestión de Repuestos:** carga de repuestos con costo para sumar al total del arreglo.
- **Carga de Archivos (WebP):** fotos comprimidas (~100-200 KB) + presupuestos en PDF. El giga gratuito de Supabase alcanza para miles de fotos.

### 3.4 Módulo Financiero y Cobranza (Calculado en Servidor)

- **Estado de Cuenta (Saldo):** panel que cruza gastos de órdenes con pagos recibidos → deuda en tiempo real (calculado con Triggers en Supabase).
- **Registro de Pagos:** señas, pagos parciales o liquidaciones totales.
- **Métodos de Pago:** Efectivo, Mercado Pago, Transferencia, Tarjeta.

### 3.5 Notas Rápidas (Flashcards)

- **Panel de Notas:** sección en el Dashboard con tarjetas de notas rápidas (recordatorios, pendientes, tareas del día).
- **Crear/Tachar/Eliminar:** se crean con un input rápido, se tachan al completarlas, se eliminan con un botón.
- **Persistencia:** las notas se guardan en Supabase (tabla `notas`) y se sincronizan offline.

### 3.6 Historial de Modificaciones por Vehículo

- **Registro Automático:** al editar un vehículo, crear/cerrar una orden o agregar repuestos, se genera un registro en la tabla `historial_modificaciones` con: fecha, hora, tipo de acción y descripción.
- **Timeline Visual:** en la ficha del vehículo, se muestra un timeline cronológico con todas las modificaciones.

### 3.7 Infraestructura Offline-First y PWA

- **Instalación Nativa:** el mecánico instala la app en celular (Android/iOS) o PC desde el navegador, sin barras ni distracciones.
- **Modo Sin Conexión:** si se corta el internet, la app sigue abriendo, permite leer órdenes recientes y anotar repuestos guardando todo localmente (Dexie.js).
- **Sincronización en Segundo Plano:** al recuperar conexión, el Service Worker empuja las actualizaciones pendientes a Supabase de forma invisible.