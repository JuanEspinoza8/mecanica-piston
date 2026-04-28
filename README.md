<div align="center">

# 🔧 Mecánica Pistón

### Sistema de Gestión Integral para Taller Mecánico

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#)

<br/>

*Aplicación web progresiva (PWA) diseñada para digitalizar y optimizar la gestión diaria de un taller mecánico automotriz. Pensada para funcionar desde el celular del mecánico, incluso sin conexión a internet.*

</div>

---

## 📖 Descripción

**Mecánica Pistón** es un sistema integral que permite gestionar clientes, vehículos, órdenes de trabajo y cobranzas desde una única plataforma. La app se instala como aplicación nativa en el celular y funciona offline, sincronizando los datos automáticamente cuando se recupera la conexión.

### ¿Por qué este proyecto?

Los talleres mecánicos pequeños y medianos suelen llevar sus registros en papel o planillas sueltas. Esto genera:

- ❌ Pérdida de historial de reparaciones
- ❌ Descontrol en las cuentas de los clientes  
- ❌ Imposibilidad de consultar datos fuera del taller
- ❌ Falta de documentación fotográfica

**Mecánica Pistón** resuelve todo esto con una herramienta moderna, gratuita y que no requiere infraestructura compleja.

---

## ✨ Funcionalidades Principales

### 🔍 Búsqueda Unificada
Barra de búsqueda global que encuentra información al instante por **patente**, **modelo del vehículo**, **teléfono** o **nombre del cliente**, con redirección directa al perfil correspondiente.

### 👥 Gestión de Clientes y Vehículos
- CRUD completo de clientes (nombre, teléfono, email, dirección)
- Registro de vehículos (patente, marca, modelo, año)
- Relación `1:N` — un cliente puede tener múltiples vehículos
- Historial centralizado por vehículo

### 🛠️ Órdenes de Trabajo (Bitácora)
- Registro detallado de reparaciones, diagnósticos y tareas
- Gestión de repuestos utilizados con costo asociado
- Subida de **fotos** (comprimidas a WebP ~100-200 KB) y **documentos PDF**
- Fechas de ingreso y egreso del vehículo

### 💰 Módulo Financiero y Cobranza
- **Estado de cuenta automático**: deuda en tiempo real (calculada en servidor)
- Registro de pagos parciales (señas) y totales
- Métodos de pago: Efectivo, Mercado Pago, Transferencia, Tarjeta

### 📌 Notas Rápidas (Flashcards)
- Panel de notas en el Dashboard para recordatorios y tareas del día
- Crear notas al instante, tacharlas al completarlas, descartarlas fácilmente
- Acceso rápido sin navegar a otra sección

### 📜 Historial de Modificaciones
- Registro automático de fecha y hora de cada cambio realizado en un vehículo
- Timeline cronológico visible en la ficha de cada vehículo
- Trazabilidad completa: quién hizo qué y cuándo

### 📱 PWA & Offline-First
- Instalable como app nativa en Android, iOS y PC
- Funciona sin conexión — permite leer y anotar datos sin internet
- Sincronización automática en segundo plano al recuperar conexión

---

## 🏗️ Arquitectura y Stack Tecnológico

> Stack 100% gratuito en su tier inicial.

```
┌──────────────────────────────────────────────────────────────────────┐
│                            FRONTEND                                  │
│  React + Vite │ Tailwind CSS │ Shadcn/ui │ Lucide │ React Router v7  │
├──────────────────────────────────────────────────────────────────────┤
│                       ESTADO & OFFLINE                               │
│  TanStack Query (caché servidor) │ Zustand (UI) │ Dexie.js (local)  │
├──────────────────────────────────────────────────────────────────────┤
│                    FORMULARIOS & UTILS                               │
│  React Hook Form + Zod │ date-fns │ Sonner │ browser-image-compress  │
├──────────────────────────────────────────────────────────────────────┤
│                        BACKEND (BaaS)                                │
│     Supabase: PostgreSQL │ Auth │ Storage │ RPC/Triggers             │
├──────────────────────────────────────────────────────────────────────┤
│                          DEPLOY                                      │
│           vite-plugin-pwa │ Vercel / Cloudflare Pages                │
└──────────────────────────────────────────────────────────────────────┘
```

| Capa | Tecnología | Propósito |
|:---|:---|:---|
| **Frontend** | React + Vite | SPA con empaquetado rápido y soporte PWA nativo |
| **Estilos** | Tailwind CSS | Diseño Mobile-First, responsivo y liviano |
| **Componentes** | Shadcn/ui + Lucide | UI profesional lista para usar |
| **Navegación** | React Router v7 | Rutas entre vistas (cliente → vehículo → orden) |
| **Caché servidor** | TanStack Query | Caché de datos de Supabase, refetch, loading states |
| **Estado UI** | Zustand | Estado local de la interfaz (modales, filtros, sidebar) |
| **Offline** | Dexie.js (IndexedDB) | Persistencia local + sync unidireccional |
| **Formularios** | React Hook Form + Zod | Validación type-safe de formularios |
| **Fechas** | date-fns | Formateo y manejo de fechas (liviano, tree-shakeable) |
| **Notificaciones** | Sonner | Toasts livianos ("Pago registrado", "Foto subida") |
| **Backend** | Supabase (PostgreSQL) | DB relacional, Auth, Storage (1 GB free) |
| **Cálculos** | Triggers / RPC Postgres | Saldos calculados en servidor |
| **Imágenes** | browser-image-compression | Compresión client-side (~5 MB → ~150 KB WebP) |
| **PWA** | vite-plugin-pwa | Genera Service Worker y manifest automáticamente |
| **Deploy** | Vercel / Cloudflare Pages | Hosting gratuito con CD desde GitHub |

---

## 📂 Estructura del Proyecto

```
mecanica-piston/
├── public/                      # Assets estáticos
├── src/
│   ├── components/              # Componentes reutilizables
│   │   └── ui/                  # Componentes Shadcn/ui
│   ├── pages/                   # Vistas principales
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Supabase client, utils
│   ├── store/                   # Estado global (Zustand)
│   ├── db/                      # Configuración Dexie.js + sync
│   ├── schemas/                 # Schemas de validación (Zod)
│   └── routes.jsx               # Configuración React Router
├── descripcion.md               # Especificación del proyecto
└── README.md
```

---

## 🚀 Instalación y Desarrollo

### Prerrequisitos

- [Node.js](https://nodejs.org/) >= 18
- [Git](https://git-scm.com/)
- Cuenta en [Supabase](https://supabase.com/) (gratuita)

### Setup Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/mecanica-piston.git
cd mecanica-piston

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

# Iniciar servidor de desarrollo
npm run dev
```

---

## 👥 Equipo

| Rol | Integrante |
|:---|:---|
| Desarrollo | *Por definir* |

---

## 📄 Licencia

Este proyecto es de uso privado para el cliente.

---

<div align="center">

**Hecho con ❤️ para el taller**

</div>