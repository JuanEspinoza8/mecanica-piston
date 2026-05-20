# Mecánica Pistón

Sistema de gestión para taller mecánico — PWA offline-first con sincronización en tiempo real.

Permite administrar clientes, vehículos, órdenes de trabajo, repuestos, cobranzas y archivos multimedia desde cualquier dispositivo, incluso sin conexión a internet.

---

## Funcionalidades

- Gestión de clientes y vehículos con relación 1:N
- Órdenes de trabajo con diagnóstico, estados y checklist de tareas
- Carga de repuestos con cálculo automático de costos
- Módulo financiero con estado de cuenta en tiempo real
- Upload de fotos (compresión WebP) y documentos PDF
- Búsqueda global por patente, modelo, nombre o teléfono
- Instalable como app nativa (PWA)
- Funciona sin conexión con sincronización automática al reconectar

---

## Stack

**Frontend** — React 19, Vite, Tailwind CSS 4, Shadcn/ui, React Router v7, React Hook Form + Zod

**Estado y datos** — TanStack Query, Zustand, Dexie.js (IndexedDB)

**Backend** — Supabase (PostgreSQL, Auth, Storage, RPC)

**PWA** — vite-plugin-pwa, Workbox (NetworkFirst / CacheFirst)

---

## Instalación

```bash
git clone https://github.com/JuanEspinoza8/mecanica-piston.git
cd mecanica-piston
npm install
```

Crear un archivo `.env` en la raíz con las credenciales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

```bash
npm run dev
```

---

## Equipo

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/JuanEspinoza8">
        <img src="https://github.com/JuanEspinoza8.png" width="80px;" alt=""/><br />
        <b>Juan Espinoza</b>
      </a>
      <br />
      Lead Developer
    </td>
    <td align="center">
      <a href="https://github.com/Lucas-04git">
        <img src="https://github.com/Lucas-04git.png" width="80px;" alt=""/><br />
        <b>Lucas</b>
      </a>
      <br />
      Frontend Developer
    </td>
  </tr>
</table>