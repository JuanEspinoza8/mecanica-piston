# 📋 Issues del Proyecto — Mecánica Pistón

> **Regla general para TODAS las issues:** Cada tarea se trabaja en una **branch nueva** con el formato `feature/ISSUE-XX-nombre-corto`. Al terminar, se abre un **Pull Request** hacia `main` para que el compañero haga code review antes de mergear.

---

## 👥 Asignaciones

| Integrante | Rol | Perfil |
|:---|:---|:---|
| **Juan** | Lead Dev | Arquitectura, integraciones, lógica compleja, Supabase, offline |
| **Lucas** | Frontend Dev | Componentes UI, formularios, maquetado, estilos con Tailwind |

---

## 🗺️ Mapa de Dependencias Rápido

```
FASE 0: Setup
  #01 ──► #02, #03, #04 (todo depende del init)
  #02 ──► #09, #13, #17, #23 (el schema de BD bloquea los hooks CRUD)
  #03 ──► #05, #06, #07, #08 (Tailwind bloquea toda UI)
  #04 ──► #05 (Router bloquea el Layout)

FASE 1: Layout
  #05 ──► #08, #10, #12, #16, #18, #28 (Layout bloquea todas las páginas)

FASE 2: Clientes
  #09 ──► #10, #12 (hooks bloquean las páginas que los consumen)
  #10, #11 ──► #12 (lista y form bloquean detalle)

FASE 3: Vehículos
  #13 ──► #14, #16 (hooks bloquean las páginas)
  #12 ──► #15 (detalle cliente bloquea form vehículo que vive ahí)

FASE 4: Órdenes
  #17 ──► #18, #19 (hooks bloquean UI de órdenes)
  #16 ──► #18 (detalle vehículo bloquea lista órdenes)

FASE 5: Financiero
  #23 ──► #25 (triggers bloquean panel de saldo)
  #17 ──► #24, #26 (órdenes bloquean pagos)

FASE 6: Búsqueda
  #09, #13 ──► #27 (hooks de clientes/vehículos bloquean búsqueda)

FASE 7: Offline & PWA
  #09, #13, #17 ──► #30 (todos los hooks bloquean Dexie sync)

FASE EXTRA: Notas Rápidas & Historial
  #02 ──► #37 (schema BD bloquea hooks de notas)
  #37 ──► #38 (hooks bloquean UI de notas)
  #02, #13, #17 ──► #39 (schema + hooks vehículos/órdenes bloquean historial)
  #39 ──► #40 (lógica historial bloquea timeline UI)

FASE 8: Deploy
  Todo ──► #35, #36
```

---

# FASE 0 — Setup e Infraestructura

---

### `ISSUE-01` 🔧 Inicializar proyecto React + Vite + dependencias

**Asignado a:** Juan
**Bloquea:** Todas las demás issues
**Bloqueado por:** Ninguna

**Descripción:**
Crear el proyecto con Vite + React. Instalar todas las dependencias del stack: Tailwind CSS, React Router v7, TanStack Query, Zustand, Dexie.js, React Hook Form, Zod, date-fns, Sonner, browser-image-compression, vite-plugin-pwa, Supabase JS client, Shadcn/ui y Lucide React.

Configurar la estructura base de carpetas (`components/`, `pages/`, `hooks/`, `lib/`, `store/`, `db/`, `schemas/`). Crear el archivo `.env.example` con las variables de Supabase. Configurar el `QueryClientProvider` de TanStack Query y el `BrowserRouter` en `main.jsx`.

**Criterios de aceptación:**
- [ ] `npm run dev` levanta sin errores
- [ ] Todas las dependencias listadas en `package.json`
- [ ] Estructura de carpetas creada
- [ ] `.env.example` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [ ] `QueryClientProvider` y `BrowserRouter` wrappeando `<App />`
- [ ] `.gitignore` configurado (incluye `.env`, `node_modules`, `dist`)

---

### `ISSUE-02` 🗄️ Crear proyecto Supabase + esquema de base de datos

**Asignado a:** Juan
**Bloquea:** #09, #13, #17, #23, #27, #30
**Bloqueado por:** Ninguna (puede hacerse en paralelo con #01)

**Descripción:**
Crear el proyecto en Supabase. Diseñar y ejecutar el esquema SQL con las tablas: `clientes`, `vehiculos`, `ordenes_trabajo`, `repuestos`, `pagos`, `archivos`, `notas`, `historial_modificaciones`. Configurar las relaciones FK (clientes 1:N vehiculos, vehiculos 1:N ordenes_trabajo, etc.). Habilitar Auth, crear bucket de Storage para archivos. Crear el archivo `supabase-schema.sql` en la raíz del repo para documentar el schema.

**Criterios de aceptación:**
- [ ] Todas las tablas creadas con sus columnas y tipos correctos (incluye `notas` e `historial_modificaciones`)
- [ ] Foreign keys y cascades configurados
- [ ] Row Level Security (RLS) habilitado con policies básicas
- [ ] Bucket `archivos` creado en Storage
- [ ] Auth habilitado (email/password)
- [ ] Archivo `supabase-schema.sql` commiteado en el repo
- [ ] Supabase client configurado en `src/lib/supabase.js`

---

### `ISSUE-03` 🎨 Configurar Tailwind CSS + sistema de diseño base

**Asignado a:** Juan
**Bloquea:** #05, #06, #07, #08, #10, #11 (toda issue de UI)
**Bloqueado por:** #01

**Descripción:**
Configurar Tailwind CSS con una paleta de colores custom para el taller (tonos oscuros/industriales o azul mecánico). Definir las variables CSS del design system: colores primarios/secundarios, radios de borde, sombras, tipografía (importar fuente de Google Fonts como Inter u Outfit). Configurar Shadcn/ui e inicializar los primeros componentes base (Button, Input, Card, Dialog). Instalar Lucide React para íconos.

**Criterios de aceptación:**
- [ ] Tailwind configurado con paleta custom
- [ ] Fuente importada desde Google Fonts
- [ ] Shadcn/ui inicializado (`components.json` presente)
- [ ] Componentes base de Shadcn instalados: Button, Input, Card, Dialog, Select, Badge
- [ ] Archivo `src/index.css` con las variables CSS del design system
- [ ] Dark mode no requerido por ahora (solo un tema)

---

### `ISSUE-04` 🧭 Configurar React Router + rutas base

**Asignado a:** Juan
**Bloquea:** #05
**Bloqueado por:** #01

**Descripción:**
Configurar React Router v7 en `src/routes.jsx`. Definir todas las rutas de la aplicación con componentes placeholder (páginas vacías con el título). Incluir rutas para: Home/Dashboard, Clientes (lista + detalle), Vehículos (detalle), Órdenes de trabajo (detalle), Pagos y 404. Configurar la ruta catch-all para 404.

**Criterios de aceptación:**
- [ ] Archivo `src/routes.jsx` con todas las rutas definidas
- [ ] Navegación entre rutas funciona sin errores
- [ ] Ruta catch-all `*` redirige a página 404 placeholder
- [ ] Rutas dinámicas con parámetros: `/clientes/:id`, `/vehiculos/:id`, `/ordenes/:id`
- [ ] Lazy loading con `React.lazy()` en al menos las páginas principales

---

# FASE 1 — Layout y Navegación

---

### `ISSUE-05` 📐 Layout principal — Header, Sidebar y contenedor

**Asignado a:** Lucas
**Bloquea:** #08, #10, #12, #16, #18, #28
**Bloqueado por:** #03, #04

**Descripción:**
Crear el componente `Layout.jsx` que envuelve todas las páginas. Incluye un **Header** fijo arriba con el logo/nombre "Mecánica Pistón" y espacio para la SearchBar (que se hará después). En desktop, un **Sidebar** lateral con los links de navegación (Dashboard, Clientes, etc.) usando íconos de Lucide. El contenido principal se renderiza en el centro con scroll.

**Criterios de aceptación:**
- [ ] Componente `Layout.jsx` creado en `src/components/`
- [ ] Header fijo con nombre de la app e ícono
- [ ] Sidebar con links: Dashboard, Clientes, Órdenes (con íconos Lucide)
- [ ] El sidebar se oculta en mobile (se reemplaza por bottom nav en #06)
- [ ] Área de contenido principal con padding y scroll correcto
- [ ] Diseño Mobile-First: se ve bien en 375px de ancho

---

### `ISSUE-06` 📱 Barra de navegación inferior (mobile)

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #05

**Descripción:**
Crear el componente `BottomNav.jsx` que aparece **solo en mobile** (oculto en desktop). Es una barra fija abajo con 4-5 íconos de navegación: Dashboard, Clientes, Nueva Orden (botón destacado), Búsqueda. Usar íconos de Lucide. El ícono activo se resalta con color.

**Criterios de aceptación:**
- [ ] Componente `BottomNav.jsx` visible solo en pantallas < 768px
- [ ] Mínimo 4 íconos de navegación con labels
- [ ] El ícono de la ruta activa se destaca visualmente
- [ ] Barra fija en la parte inferior (sticky bottom)
- [ ] No tapa el contenido de la página (padding-bottom en el layout)

---

### `ISSUE-07` 🚫 Página 404

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #03

**Descripción:**
Crear la página `NotFound.jsx` con un diseño amigable que se muestra cuando la ruta no existe. Incluir un ícono grande, mensaje descriptivo y un botón "Volver al inicio" que navega a `/`.

**Criterios de aceptación:**
- [ ] Página `NotFound.jsx` en `src/pages/`
- [ ] Diseño centrado con ícono, título y descripción
- [ ] Botón funcional que lleva a la home
- [ ] Se muestra para cualquier ruta inexistente
- [ ] Responsive (se ve bien en mobile y desktop)

---

### `ISSUE-08` 🏠 Página Dashboard / Home

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #05

**Descripción:**
Crear la página `Dashboard.jsx` que es la vista principal al abrir la app. Por ahora con datos placeholder/mock. Debe mostrar cards con: cantidad de clientes, órdenes abiertas, deudas pendientes, y un listado de "últimas órdenes". Usar componentes Card de Shadcn/ui.

**Criterios de aceptación:**
- [ ] Página `Dashboard.jsx` en `src/pages/`
- [ ] Mínimo 3 cards de resumen con íconos y números (datos mock por ahora)
- [ ] Sección "Últimas órdenes" con lista placeholder
- [ ] Layout responsivo: cards en grid 1 col mobile, 3 cols desktop
- [ ] Estilos consistentes con el design system

---

# FASE 2 — Módulo de Clientes

---

### `ISSUE-09` 🔌 Hooks CRUD + schemas Zod para Clientes

**Asignado a:** Juan
**Bloquea:** #10, #12
**Bloqueado por:** #01, #02

**Descripción:**
Crear el schema de validación Zod para clientes (`src/schemas/cliente.schema.js`). Crear custom hooks con TanStack Query para todas las operaciones CRUD: `useClientes()`, `useCliente(id)`, `useCreateCliente()`, `useUpdateCliente()`, `useDeleteCliente()`. Cada hook conecta con Supabase y maneja loading, error e invalidación de caché.

**Criterios de aceptación:**
- [ ] Schema Zod con validaciones: nombre (requerido), teléfono, email (formato), dirección
- [ ] `useClientes()` retorna lista paginada con loading/error
- [ ] `useCliente(id)` retorna un cliente por ID
- [ ] `useCreateCliente()` crea y hace invalidate del cache
- [ ] `useUpdateCliente()` actualiza y hace invalidate
- [ ] `useDeleteCliente()` elimina con confirmación
- [ ] Toast de Sonner en éxito/error de cada operación

---

### `ISSUE-10` 📃 Página lista de Clientes

**Asignado a:** Lucas
**Bloquea:** #12
**Bloqueado por:** #05, #09

**Descripción:**
Crear la página `ClientesList.jsx` que muestra todos los clientes en formato lista/cards. Cada card muestra nombre, teléfono y cantidad de vehículos. Incluir un botón "Nuevo Cliente" que abre el formulario (modal o página). Consumir el hook `useClientes()` creado por Juan.

**Criterios de aceptación:**
- [ ] Página `ClientesList.jsx` renderiza la lista desde el hook
- [ ] Cada item muestra: nombre, teléfono, badge con cant. de vehículos
- [ ] Botón "Nuevo Cliente" visible y funcional (abre modal/navega)
- [ ] Estado de carga visible (spinner o skeleton)
- [ ] Estado vacío con mensaje amigable si no hay clientes
- [ ] Click en un cliente navega a `/clientes/:id`

---

### `ISSUE-11` 📝 Formulario alta/edición de Cliente

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #03, #09

**Descripción:**
Crear el componente `ClienteForm.jsx` reutilizable para crear y editar clientes. Usar React Hook Form + el schema Zod de clientes. Campos: nombre, apellido, teléfono, email, dirección. En modo edición, los campos vienen pre-cargados. Usar componentes Input y Button de Shadcn/ui.

**Criterios de aceptación:**
- [ ] Componente `ClienteForm.jsx` en `src/components/`
- [ ] Usa React Hook Form con resolver de Zod
- [ ] Campos: nombre, apellido, teléfono, email, dirección
- [ ] Validación visual en tiempo real (bordes rojos + mensaje de error)
- [ ] Funciona en modo "crear" y modo "editar" (recibe prop `defaultValues`)
- [ ] Botón submit deshabilitado si el form es inválido
- [ ] Llama al hook `useCreateCliente` o `useUpdateCliente` según el modo

---

### `ISSUE-12` 👤 Página detalle de Cliente

**Asignado a:** Lucas
**Bloquea:** #15
**Bloqueado por:** #05, #09, #10

**Descripción:**
Crear la página `ClienteDetail.jsx` que muestra toda la info de un cliente. Consume `useCliente(id)` con el ID de la URL. Muestra los datos personales, botones de editar/eliminar, y una sección con la lista de vehículos asociados (que se conectará cuando exista el módulo de vehículos). Incluir botón "Agregar Vehículo".

**Criterios de aceptación:**
- [ ] Página `ClienteDetail.jsx` en `src/pages/`
- [ ] Obtiene el `id` de `useParams()` y consume `useCliente(id)`
- [ ] Muestra: nombre completo, teléfono, email, dirección
- [ ] Botones "Editar" (abre form) y "Eliminar" (con confirmación Dialog)
- [ ] Sección "Vehículos" con lista (vacía por ahora, se conecta en Fase 3)
- [ ] Botón "Agregar Vehículo" placeholder
- [ ] Loading state y manejo de error (cliente no encontrado → 404)

---

# FASE 3 — Módulo de Vehículos

---

### `ISSUE-13` 🔌 Hooks CRUD + schemas Zod para Vehículos

**Asignado a:** Juan
**Bloquea:** #14, #16
**Bloqueado por:** #01, #02

**Descripción:**
Crear schema Zod para vehículos y custom hooks TanStack Query: `useVehiculos(clienteId)`, `useVehiculo(id)`, `useCreateVehiculo()`, `useUpdateVehiculo()`, `useDeleteVehiculo()`. El hook de lista filtra por `cliente_id`. Incluir la relación con el cliente en las queries (join).

**Criterios de aceptación:**
- [ ] Schema Zod: patente (requerido, formato argentino), marca, modelo, año
- [ ] `useVehiculos(clienteId)` retorna vehículos de un cliente
- [ ] `useVehiculo(id)` retorna un vehículo con datos del dueño (join)
- [ ] Mutations de crear/actualizar/eliminar con invalidación de caché
- [ ] Toast de Sonner en cada operación

---

### `ISSUE-14` 🚗 Componente Card de Vehículo

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #03, #13

**Descripción:**
Crear el componente `VehiculoCard.jsx` reutilizable que muestra la info resumida de un vehículo: patente (destacada), marca, modelo y año. Incluir un badge de color si tiene órdenes abiertas. Click en la card navega a `/vehiculos/:id`.

**Criterios de aceptación:**
- [ ] Componente `VehiculoCard.jsx` en `src/components/`
- [ ] Muestra: patente en grande, marca + modelo, año
- [ ] Estilo de card con sombra y hover effect
- [ ] Click navega al detalle del vehículo
- [ ] Responsive: se adapta bien en mobile

---

### `ISSUE-15` 📝 Formulario alta/edición de Vehículo

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #03, #12, #13

**Descripción:**
Crear `VehiculoForm.jsx` con React Hook Form + Zod. Campos: patente, marca, modelo, año. El `cliente_id` se pasa como prop (viene del detalle del cliente). Reutilizable para crear y editar.

**Criterios de aceptación:**
- [ ] Componente `VehiculoForm.jsx` en `src/components/`
- [ ] Campos con validación Zod (patente formato argentino: ABC123 o AB123CD)
- [ ] Recibe `clienteId` como prop para asociar al cliente
- [ ] Modo crear y modo editar
- [ ] Integrado con los hooks `useCreateVehiculo` / `useUpdateVehiculo`

---

### `ISSUE-16` 🔧 Página detalle de Vehículo + historial

**Asignado a:** Juan
**Bloquea:** #18
**Bloqueado por:** #05, #13

**Descripción:**
Crear `VehiculoDetail.jsx` que muestra la ficha completa del vehículo, datos del dueño (link al perfil), y el historial de órdenes de trabajo (todas las visitas al taller). Incluir botones editar/eliminar y "Nueva Orden de Trabajo". Esta página es más compleja porque integra datos de múltiples tablas.

**Criterios de aceptación:**
- [ ] Muestra: patente, marca, modelo, año, datos del dueño con link
- [ ] Sección "Historial" con lista de órdenes (vacía por ahora, se conecta en Fase 4)
- [ ] Botones editar/eliminar vehículo
- [ ] Botón "Nueva Orden" placeholder
- [ ] Query con join a tabla clientes para mostrar el dueño

---

# FASE 4 — Módulo de Órdenes de Trabajo

---

### `ISSUE-17` 🔌 Hooks CRUD + schemas para Órdenes de Trabajo

**Asignado a:** Juan
**Bloquea:** #18, #19, #21, #22, #24, #26
**Bloqueado por:** #01, #02

**Descripción:**
Crear schemas Zod y hooks para órdenes de trabajo y repuestos. Hooks: `useOrdenes(vehiculoId)`, `useOrden(id)`, `useCreateOrden()`, `useUpdateOrden()`. Sub-hooks para repuestos: `useRepuestos(ordenId)`, `useAddRepuesto()`, `useDeleteRepuesto()`. Las queries de órdenes deben calcular el costo total sumando repuestos.

**Criterios de aceptación:**
- [ ] Schema Zod para orden: descripción, diagnóstico, fecha_ingreso, fecha_egreso, estado (abierta/cerrada)
- [ ] Schema Zod para repuesto: nombre, costo, cantidad
- [ ] Hooks CRUD para órdenes con filtro por `vehiculo_id`
- [ ] Hooks para repuestos con filtro por `orden_id`
- [ ] Query de orden incluye suma total de repuestos
- [ ] Toast en cada operación

---

### `ISSUE-18` 📃 Lista de Órdenes de Trabajo

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #05, #16, #17

**Descripción:**
Crear la vista de lista de órdenes dentro del detalle de vehículo. Cada item muestra: fecha, estado (badge "Abierta"/"Cerrada"), descripción resumida y costo total. Conectar con `useOrdenes(vehiculoId)`.

**Criterios de aceptación:**
- [ ] Lista renderizada dentro de `VehiculoDetail`
- [ ] Cada orden muestra: fecha formateada (date-fns), estado con Badge de color, descripción truncada, costo
- [ ] Click en una orden navega a `/ordenes/:id`
- [ ] Badge verde para "Abierta", gris para "Cerrada"
- [ ] Estado vacío si no hay órdenes

---

### `ISSUE-19` 📝 Formulario de Orden de Trabajo

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #03, #17

**Descripción:**
Crear `OrdenForm.jsx` con campos: descripción (textarea), diagnóstico (textarea), fecha de ingreso (date picker), estado. Recibe `vehiculoId` como prop. Usar React Hook Form + Zod.

**Criterios de aceptación:**
- [ ] Campos: descripción, diagnóstico, fecha ingreso, estado (select)
- [ ] Textarea para descripción y diagnóstico
- [ ] Date picker para fecha (puede ser input type="date" con format de date-fns)
- [ ] Validación Zod integrada
- [ ] Integrado con `useCreateOrden` / `useUpdateOrden`

---

### `ISSUE-20` 🔩 Sub-formulario de Repuestos

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #17, #19

**Descripción:**
Crear `RepuestosSection.jsx` que se muestra dentro del detalle de una orden. Permite agregar repuestos (nombre + costo + cantidad) con un mini-form inline, ver la lista de repuestos cargados y eliminar repuestos individuales. Muestra el subtotal de repuestos.

**Criterios de aceptación:**
- [ ] Mini-formulario inline: nombre de pieza, costo, cantidad, botón "Agregar"
- [ ] Lista de repuestos con botón eliminar (ícono tacho)
- [ ] Muestra subtotal calculado (suma de costo × cantidad)
- [ ] Consume hooks `useRepuestos`, `useAddRepuesto`, `useDeleteRepuesto`
- [ ] Validación: nombre requerido, costo > 0

---

### `ISSUE-21` 📸 Upload de fotos con compresión WebP

**Asignado a:** Juan
**Bloquea:** Ninguna
**Bloqueado por:** #02, #17

**Descripción:**
Crear el hook `useFileUpload()` y componente `PhotoUploader.jsx`. Al seleccionar una foto, comprimirla con `browser-image-compression` a WebP (~150 KB), subirla al bucket de Supabase Storage, y guardar la URL en la tabla `archivos` asociada a la orden. Mostrar preview de la imagen antes de subir y una galería de fotos ya subidas.

**Criterios de aceptación:**
- [ ] Compresión funcional: foto de 5 MB → ~150 KB WebP
- [ ] Preview de imagen antes de subir
- [ ] Progress bar durante la subida
- [ ] Galería de fotos subidas con thumbnail
- [ ] Opción de eliminar foto (borra de Storage + tabla)
- [ ] Toast de éxito/error

---

### `ISSUE-22` 📄 Upload de documentos PDF

**Asignado a:** Juan
**Bloquea:** Ninguna
**Bloqueado por:** #02, #17

**Descripción:**
Extender el sistema de upload para aceptar archivos PDF (presupuestos, facturas). Sin compresión, solo subir al bucket de Storage con límite de tamaño (5 MB max). Mostrar lista de documentos con ícono PDF y opción de descargar/eliminar.

**Criterios de aceptación:**
- [ ] Acepta archivos `.pdf` con límite de 5 MB
- [ ] Validación de tipo de archivo y tamaño
- [ ] Lista de documentos subidos con ícono, nombre y fecha
- [ ] Botón descargar (abre en nueva pestaña)
- [ ] Botón eliminar con confirmación

---

# FASE 5 — Módulo Financiero y Cobranza

---

### `ISSUE-23` ⚙️ Triggers y RPC en Supabase para cálculo de saldos

**Asignado a:** Juan
**Bloquea:** #25
**Bloqueado por:** #02

**Descripción:**
Crear en Supabase los triggers y/o funciones RPC de PostgreSQL para calcular automáticamente el saldo de cada cliente. La lógica: saldo = (suma de costos de repuestos de todas las órdenes del cliente) − (suma de pagos registrados). Esto se calcula en el servidor para no sobrecargar el celular. Puede ser una vista materializada o una función RPC `get_saldo_cliente(cliente_id)`.

**Criterios de aceptación:**
- [ ] Función RPC o vista que calcula el saldo de un cliente
- [ ] Considera todos los vehículos del cliente → todas las órdenes → todos los repuestos
- [ ] Resta correctamente los pagos registrados
- [ ] Retorna el saldo actualizado en tiempo real
- [ ] SQL documentado en `supabase-schema.sql`
- [ ] Hook `useSaldoCliente(clienteId)` creado para consumirlo

---

### `ISSUE-24` 📝 Formulario de Pago

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #03, #17

**Descripción:**
Crear `PagoForm.jsx` con campos: monto, fecha, método de pago (Select con opciones: Efectivo, Mercado Pago, Transferencia, Tarjeta), y nota opcional. Usar React Hook Form + Zod. El formulario recibe `clienteId` y `ordenId` como props.

**Criterios de aceptación:**
- [ ] Campos: monto (numérico > 0), fecha, método de pago (Select), nota
- [ ] Select de método de pago con las 4 opciones
- [ ] Validación Zod: monto requerido y positivo, método requerido
- [ ] Integrado con hook `useCreatePago`
- [ ] Toast de confirmación al registrar pago

---

### `ISSUE-25` 💰 Panel de Estado de Cuenta

**Asignado a:** Juan
**Bloquea:** Ninguna
**Bloqueado por:** #23, #12

**Descripción:**
Crear el componente `EstadoCuenta.jsx` que se muestra en el detalle del cliente. Consume el hook `useSaldoCliente()` y muestra: total de trabajos, total pagado, saldo pendiente (con color rojo si debe, verde si está al día). Incluir un botón "Registrar Pago" que abre el `PagoForm`.

**Criterios de aceptación:**
- [ ] Componente muestra: Total trabajos, Total pagado, Saldo (con color condicional)
- [ ] Saldo negativo → texto rojo "Debe $X"
- [ ] Saldo 0 → texto verde "Al día"
- [ ] Botón "Registrar Pago" abre modal con `PagoForm`
- [ ] Se actualiza en tiempo real después de registrar un pago (invalidate query)

---

### `ISSUE-26` 📜 Historial de Pagos

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #17, #24

**Descripción:**
Crear `PagosHistorial.jsx` que muestra la lista de todos los pagos de un cliente, ordenados por fecha descendente. Cada item muestra: fecha formateada, monto, método de pago (con ícono/badge) y nota. Consumir hook `usePagos(clienteId)`.

**Criterios de aceptación:**
- [ ] Lista de pagos ordenada por fecha (más reciente primero)
- [ ] Cada pago muestra: fecha (date-fns format), monto con símbolo $, método (badge con color), nota
- [ ] Badge de color por método: verde=Efectivo, azul=Transferencia, celeste=MercadoPago, violeta=Tarjeta
- [ ] Estado vacío si no hay pagos
- [ ] Se renderiza dentro del detalle del cliente

---

# FASE 6 — Búsqueda Global

---

### `ISSUE-27` 🔍 Lógica de búsqueda global

**Asignado a:** Juan
**Bloquea:** #28, #29
**Bloqueado por:** #09, #13

**Descripción:**
Crear el hook `useSearch(query)` que busca simultáneamente en las tablas `clientes` (nombre, apellido, teléfono) y `vehiculos` (patente, modelo). Usar `ilike` de Supabase para búsqueda parcial. Implementar debounce (300ms) para no disparar queries en cada tecla. Retornar resultados agrupados por tipo (clientes / vehículos).

**Criterios de aceptación:**
- [x] Hook `useSearch(query)` con debounce de 300ms
- [x] Busca en: nombre, apellido, teléfono de clientes + patente y modelo de vehículos
- [x] Retorna resultados agrupados: `{ clientes: [...], vehiculos: [...] }`
- [x] No dispara query si el input tiene menos de 2 caracteres
- [x] Loading state mientras busca
- [x] Búsqueda parcial (escribir "Gon" encuentra "González")

---

### `ISSUE-28` 🔎 Componente SearchBar

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #05, #27

**Descripción:**
Crear `SearchBar.jsx` que se integra en el Header del layout. Input con ícono de lupa, placeholder "Buscar por patente, modelo, nombre o teléfono...". Al escribir, muestra un dropdown con los resultados agrupados (sección "Clientes" y sección "Vehículos"). Click en un resultado navega al detalle correspondiente.

**Criterios de aceptación:**
- [ ] Input con ícono de búsqueda (Lucide `Search`)
- [ ] Dropdown de resultados aparece debajo del input
- [ ] Resultados separados en secciones: "Clientes" y "Vehículos"
- [ ] Cada resultado muestra info resumida (nombre+tel / patente+modelo)
- [ ] Click navega a `/clientes/:id` o `/vehiculos/:id`
- [ ] Click fuera del dropdown lo cierra
- [ ] Se muestra en el Header, responsive en mobile (puede ser ícono que expande)

---

### `ISSUE-29` 📋 Página de resultados de búsqueda (mobile)

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #27, #28

**Descripción:**
Crear `SearchResults.jsx` como página completa para mobile (cuando el dropdown del header no es cómodo). Se accede desde el ícono de búsqueda en el `BottomNav`. Muestra un input grande arriba y los resultados en lista completa debajo.

**Criterios de aceptación:**
- [ ] Página `SearchResults.jsx` con ruta `/buscar`
- [ ] Input de búsqueda grande en la parte superior
- [ ] Resultados en lista (no dropdown) con separación por tipo
- [ ] Misma lógica que SearchBar pero en formato página completa
- [ ] Accesible desde el BottomNav

---

# FASE 7 — Offline-First y PWA

---

### `ISSUE-30` 💾 Configurar Dexie.js + sincronización offline

**Asignado a:** Juan
**Bloquea:** #32
**Bloqueado por:** #09, #13, #17

**Descripción:**
Configurar Dexie.js con tablas espejo de Supabase (clientes, vehiculos, ordenes, repuestos, pagos). Implementar la lógica de sync unidireccional: al cargar datos de Supabase, guardarlos también en IndexedDB. Si no hay conexión, leer desde IndexedDB. Al crear/editar offline, guardar en una cola de pendientes (`pending_sync`) que se procesa cuando vuelve la conexión.

**Criterios de aceptación:**
- [ ] Dexie.js configurado en `src/db/` con todas las tablas
- [ ] Al hacer fetch de Supabase, los datos se cachean en IndexedDB
- [ ] Sin conexión, la app lee de IndexedDB
- [ ] Escrituras offline se guardan en tabla `pending_sync`
- [ ] Al reconectar, se procesan los pendientes en orden (FIFO)
- [ ] Indicador en la UI de cuántos cambios hay pendientes de sync

---

### `ISSUE-31` 📲 Configurar vite-plugin-pwa

**Asignado a:** Juan
**Bloquea:** Ninguna
**Bloqueado por:** #01

**Descripción:**
Configurar `vite-plugin-pwa` en `vite.config.js`. Definir el manifest con nombre "Mecánica Pistón", colores del theme, íconos de la app (192x192 y 512x512). Configurar el Service Worker con estrategia de caché (NetworkFirst para API, CacheFirst para assets estáticos). Crear los íconos de la app.

**Criterios de aceptación:**
- [ ] Plugin configurado en `vite.config.js`
- [ ] Manifest con nombre, short_name, colores, íconos
- [ ] Íconos de 192x192 y 512x512 en `/public/`
- [ ] Service Worker funcional con estrategia de cache
- [ ] La app se puede "instalar" desde Chrome (aparece el banner)
- [ ] Offline, la app carga el shell (no muestra dinosaurio de Chrome)

---

### `ISSUE-32` 📡 Indicadores de estado offline en la UI

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #30

**Descripción:**
Crear componente `ConnectionStatus.jsx` que muestra un banner/badge cuando el usuario está offline. Usar `navigator.onLine` y event listeners `online`/`offline`. Cuando está offline, mostrar un banner amarillo sutil en la parte superior "Sin conexión — Los cambios se guardarán localmente". Al reconectar, mostrar brevemente "Conexión restaurada — Sincronizando..." en verde.

**Criterios de aceptación:**
- [ ] Componente detecta estado online/offline correctamente
- [ ] Banner amarillo visible cuando está offline
- [ ] Banner verde transitorio al reconectar (desaparece en 3 segundos)
- [ ] No es intrusivo, no tapa contenido importante
- [ ] Se integra en el Layout principal (arriba del header)

---

### `ISSUE-33` 🔔 Integrar notificaciones toast (Sonner)

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #01

**Descripción:**
Configurar el componente `<Toaster />` de Sonner en el `App.jsx`. Definir los estilos de los toasts para que sean consistentes con el design system (colores, posición, duración). Verificar que todos los hooks CRUD de Juan estén usando `toast.success()` y `toast.error()` correctamente.

**Criterios de aceptación:**
- [ ] `<Toaster />` configurado en `App.jsx`
- [ ] Posición: bottom-right en desktop, top-center en mobile
- [ ] Estilos consistentes con el design system
- [ ] Duración por defecto: 3 segundos
- [ ] Verificar que funciona en: crear cliente, crear orden, registrar pago, subir foto

---

# FASE 8 — Testing, Polish y Deploy

---

### `ISSUE-34` 📱 Testing responsivo + ajustes Mobile-First

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** Todas las issues de UI completadas

**Descripción:**
Revisar toda la aplicación en distintos tamaños de pantalla (375px, 768px, 1024px, 1440px). Corregir problemas de overflow, textos cortados, botones inaccesibles, etc. Verificar que la app sea usable en el celular del mecánico (touch targets de mínimo 44px, scrolls correctos, teclado no tape inputs).

**Criterios de aceptación:**
- [ ] App usable en 375px (iPhone SE) sin scroll horizontal
- [ ] Todos los botones tienen mínimo 44px de touch target
- [ ] Formularios no son tapados por el teclado virtual
- [ ] Tablas/listas se ven bien en mobile (scroll horizontal si es necesario)
- [ ] No hay textos cortados ni overlaps en ningún breakpoint
- [ ] Testeado en Chrome DevTools responsive mode

---

### `ISSUE-35` 🛡️ Error boundaries + loading states globales

**Asignado a:** Juan
**Bloquea:** Ninguna
**Bloqueado por:** Todas las issues de lógica completadas

**Descripción:**
Crear un componente `ErrorBoundary.jsx` que atrapa errores de React y muestra una pantalla de error amigable en vez de romper la app. Crear un componente `LoadingPage.jsx` para usar como fallback de `React.lazy()`. Revisar que todos los hooks tengan manejo de error correcto. Agregar `Suspense` boundaries donde haga falta.

**Criterios de aceptación:**
- [ ] `ErrorBoundary` wrappea las rutas principales
- [ ] Pantalla de error con botón "Reintentar" y "Volver al inicio"
- [ ] `LoadingPage` con spinner/skeleton centrado
- [ ] `Suspense` en cada `React.lazy()` con fallback
- [ ] No hay errores sin manejar en la consola en flujo normal

---

# FASE EXTRA — Notas Rápidas e Historial de Modificaciones

---

### `ISSUE-37` 🔌 Hooks CRUD + schema para Notas Rápidas

**Asignado a:** Juan
**Bloquea:** #38
**Bloqueado por:** #02

**Descripción:**
Crear el schema Zod y hooks TanStack Query para la tabla `notas`. Campos: `texto`, `completada` (boolean), `created_at`. Hooks: `useNotas()`, `useCreateNota()`, `useToggleNota(id)` (tachar/destachar), `useDeleteNota(id)`. Las notas se ordenan por fecha de creación, mostrando primero las no completadas.

**Criterios de aceptación:**
- [ ] Schema Zod: texto (requerido, max 200 chars), completada (boolean default false)
- [ ] `useNotas()` retorna lista ordenada (pendientes primero, luego completadas)
- [ ] `useCreateNota()` crea nota con texto
- [ ] `useToggleNota()` alterna el estado completada/pendiente
- [ ] `useDeleteNota()` elimina con confirmación
- [ ] Toast de Sonner en cada operación

---

### `ISSUE-38` 📌 UI de Notas Rápidas (Flashcards) en Dashboard

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #08, #37

**Descripción:**
Crear el componente `NotasRapidas.jsx` que se integra en el Dashboard. Muestra una sección con tarjetas tipo flashcard para las notas del día. Incluye un input rápido para crear nuevas notas, cada nota tiene un checkbox para tacharla y un botón para eliminarla. Las notas completadas se muestran tachadas y con opacidad reducida.

**Criterios de aceptación:**
- [ ] Componente `NotasRapidas.jsx` integrado en el Dashboard
- [ ] Input rápido en la parte superior: escribir texto + Enter para crear nota
- [ ] Cada nota muestra: checkbox, texto, botón eliminar (ícono X)
- [ ] Al tachar: texto con `line-through` y opacidad 50%
- [ ] Las notas pendientes aparecen arriba, las completadas abajo
- [ ] Animación suave al crear/eliminar notas (transición)
- [ ] Responsive: se ve bien en mobile y desktop

---

### `ISSUE-39` 🔌 Lógica de Historial de Modificaciones

**Asignado a:** Juan
**Bloquea:** #40
**Bloqueado por:** #02, #13, #17

**Descripción:**
Crear la lógica para registrar automáticamente cada modificación relevante sobre un vehículo. Puede implementarse con triggers de PostgreSQL en Supabase (al INSERT/UPDATE en `vehiculos`, `ordenes_trabajo`, `repuestos`) o manualmente en los hooks existentes. Cada registro guarda: `vehiculo_id`, `tipo_accion` (ej: "Orden creada", "Repuesto agregado", "Vehículo editado"), `descripcion`, `fecha_hora`. Crear hook `useHistorialModificaciones(vehiculoId)` para consumirlo.

**Criterios de aceptación:**
- [ ] Tabla `historial_modificaciones` en Supabase con columnas: id, vehiculo_id (FK), tipo_accion, descripcion, created_at
- [ ] Se genera registro al: crear/cerrar orden, agregar/eliminar repuesto, editar vehículo
- [ ] Hook `useHistorialModificaciones(vehiculoId)` retorna lista ordenada por fecha desc
- [ ] Triggers SQL o lógica en hooks para el registro automático
- [ ] SQL documentado en `supabase-schema.sql`

---

### `ISSUE-40` 📜 Timeline visual de Historial de Modificaciones

**Asignado a:** Lucas
**Bloquea:** Ninguna
**Bloqueado por:** #16, #39

**Descripción:**
Crear el componente `HistorialTimeline.jsx` que se muestra en la página de detalle del vehículo. Renderiza un timeline vertical cronológico con cada modificación: ícono según tipo de acción, fecha/hora formateada, y descripción. Usar date-fns para formatear las fechas de forma legible (ej: "Hace 2 horas", "Ayer a las 15:30").

**Criterios de aceptación:**
- [ ] Componente `HistorialTimeline.jsx` integrado en `VehiculoDetail`
- [ ] Timeline vertical con línea conectora entre eventos
- [ ] Cada evento muestra: ícono (Lucide) según tipo, fecha relativa (date-fns `formatDistanceToNow`), descripción
- [ ] Íconos por tipo: 🔧 orden creada, ✅ orden cerrada, 🔩 repuesto, ✏️ edición
- [ ] Estado vacío si no hay historial
- [ ] Scroll si hay muchos eventos, con carga lazy o paginación

---

### `ISSUE-36` 🚀 Deploy a Vercel + dominio

**Asignado a:** Juan
**Bloquea:** Ninguna
**Bloqueado por:** Todas las issues anteriores

**Descripción:**
Conectar el repositorio de GitHub con Vercel. Configurar las variables de entorno de Supabase en el dashboard de Vercel. Hacer el primer deploy. Verificar que la PWA funcione en producción (instalación, offline, Service Worker). Configurar dominio custom si hay uno disponible.

**Criterios de aceptación:**
- [ ] Proyecto conectado a Vercel desde GitHub
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build exitoso sin errores
- [ ] La app funciona correctamente en la URL de Vercel
- [ ] PWA instalable desde el navegador del celular
- [ ] HTTPS funcionando correctamente
- [ ] CD activo: cada push a `main` triggerea un redeploy

---

# 📊 Resumen de Distribución

## Juan — 19 issues (Arquitectura, integraciones, lógica compleja)

| # | Issue | Fase |
|:---|:---|:---|
| 01 | Inicializar proyecto | Setup |
| 02 | Supabase + schema BD | Setup |
| 03 | Tailwind + design system | Setup |
| 04 | React Router + rutas | Setup |
| 09 | Hooks CRUD Clientes | Clientes |
| 13 | Hooks CRUD Vehículos | Vehículos |
| 16 | Detalle Vehículo + historial | Vehículos |
| 17 | Hooks CRUD Órdenes + Repuestos | Órdenes |
| 21 | Upload fotos + compresión | Órdenes |
| 22 | Upload documentos PDF | Órdenes |
| 23 | Triggers/RPC saldos | Financiero |
| 25 | Panel Estado de Cuenta | Financiero |
| 27 | Lógica búsqueda global | Búsqueda |
| 30 | Dexie.js + sync offline | Offline |
| 31 | vite-plugin-pwa | PWA |
| 35 | Error boundaries | Polish |
| 36 | Deploy a Vercel | Deploy |
| 37 | Hooks Notas Rápidas | Notas |
| 39 | Lógica Historial Modificaciones | Historial |

## Lucas — 21 issues (UI, componentes, formularios, estilos)

| # | Issue | Fase |
|:---|:---|:---|
| 05 | Layout principal | Layout |
| 06 | Bottom nav mobile | Layout |
| 07 | Página 404 | Layout |
| 08 | Dashboard / Home | Layout |
| 10 | Lista de Clientes | Clientes |
| 11 | Formulario Cliente | Clientes |
| 12 | Detalle de Cliente | Clientes |
| 14 | Card de Vehículo | Vehículos |
| 15 | Formulario Vehículo | Vehículos |
| 18 | Lista de Órdenes | Órdenes |
| 19 | Formulario Orden | Órdenes |
| 20 | Sub-form Repuestos | Órdenes |
| 24 | Formulario de Pago | Financiero |
| 26 | Historial de Pagos | Financiero |
| 28 | SearchBar UI | Búsqueda |
| 29 | Página resultados búsqueda | Búsqueda |
| 32 | Indicadores offline | Offline |
| 33 | Toasts (Sonner) | PWA |
| 34 | Testing responsivo | Polish |
| 38 | UI Notas Rápidas (Flashcards) | Notas |
| 40 | Timeline Historial Modificaciones | Historial |

> **Nota:** Juan tiene 19 issues y Lucas 21, pero las de Lucas son más simples y rápidas (componentes UI). Las de Juan involucran más investigación, configuración y lógica de negocio, por lo que el tiempo total debería ser similar.
