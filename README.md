# ⚙️ Mecánica Pistón

**Sistema de gestión para taller mecánico** — PWA offline-first con sincronización en tiempo real.

Administra clientes, vehículos, órdenes de trabajo, repuestos, cobranzas y archivos multimedia desde cualquier dispositivo, incluso sin conexión a internet.

![Version](https://img.shields.io/badge/version-1.0.2-red?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-Production-brightgreen?style=flat-square)

---

## Funcionalidades

- Gestión de clientes y vehículos
- Órdenes de trabajo con diagnóstico, estados y checklist de tareas
- Carga de repuestos con cálculo automático de costos
- Módulo financiero con estado de cuenta en tiempo real
- Upload de fotos y documentos PDF
- Búsqueda global por patente, modelo, nombre o teléfono
- Instalable como app nativa
- Funciona sin conexión con sincronización automática al reconectar

---

## Stack

### Frontend
<p>
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/React_Router_v7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/Shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="Shadcn" />
</p>

### Estado y Datos
<p>
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" alt="TanStack Query" />
  <img src="https://img.shields.io/badge/Zustand-433E38?style=for-the-badge" alt="Zustand" />
  <img src="https://img.shields.io/badge/Dexie.js-1A73E8?style=for-the-badge" alt="Dexie" />
  <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white" alt="RHF" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
</p>

### Backend
<p>
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
</p>

---

## Setup

```bash
git clone https://github.com/JuanEspinoza8/mecanica-piston.git
cd mecanica-piston
npm install
```

Crear `.env` con las credenciales de Supabase:

```env
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
