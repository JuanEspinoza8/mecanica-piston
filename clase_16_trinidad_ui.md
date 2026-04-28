# 👨‍🏫 Clase 16: La Trinidad de UI (Interactividad Premium)

En esta sesión, hemos transformado componentes estáticos en interfaces dinámicas, elevando el valor percibido de "Mecánica Pistón" antes de su integración final con la base de datos real.

## 🚀 1. Tablero Kanban (Drag & Drop)
En la pantalla de Órdenes de Trabajo, implementamos una vista dual: Lista tradicional y Tablero Kanban.
- Usamos la **API Nativa de HTML5 Drag and Drop** (`onDragStart`, `onDragOver`, `onDrop`).
- Esto evita depender de librerías externas pesadas (como dnd-kit o react-beautiful-dnd) que a veces fallan en React 19 o engordan el *bundle* final.
- Los usuarios pueden arrastrar tarjetas entre las columnas "En Proceso", "Esperando Repuesto" y "Terminado". El cambio de estado es inmediato y visual.

## ✅ 2. Checklist de Tareas y Mano de Obra
El componente `OrdenDetail` dejó de ser un simple visor y ahora actúa como una verdadera orden de taller:
- **Estado Dinámico:** Las tareas se manejan en un `useState`.
- **Barra de Progreso:** Al hacer clic en una tarea, cambia a `Terminado` y la barra de progreso roja avanza fluídamente (`transition-all duration-500`).
- **Mano de Obra Editable:** Agregamos un input en la sección de totales. Lo que escribes en "Mano de Obra" se suma en tiempo real al costo de repuestos para darte el "Total Estimado" final.

## 📸 3. Visor de Galería Inmersivo
Creamos el componente `<ImageViewerModal />`:
- Al hacer clic en una miniatura de la evidencia fotográfica, se abre un modal a pantalla completa (estilo Instagram/WhatsApp).
- Soporta navegación por botones y uso del teclado (Flechas para moverse, Esc para cerrar).
- Tiene un fondo `backdrop-blur-md` elegante para mantener el foco del usuario.

---

### 📝 Resumen para tu Pull Request:

Copia y pega este texto cuando fusiones tu rama `feature/trinidad-ui` hacia `develop`:

```markdown
### ✨ Feature: Trinidad de UI - Kanban, Checklist y Galería

1. **Gestión Kanban:** Se añadió soporte Drag & Drop nativo en `/ordenes`. Ahora los mecánicos pueden arrastrar órdenes entre columnas de estados, cambiando su estatus en tiempo real.
2. **Tareas Interactivas:** En el detalle de la orden, el progreso ahora es rastreable mediante checkboxes funcionales y una barra de progreso que responde al instante.
3. **Mano de Obra Calculable:** Nuevo campo in-line para ingresar el costo del trabajo mecánico, actualizando el Ticket Total de forma dinámica.
4. **Visor de Evidencia:** Nuevo `<ImageViewerModal />` con soporte de teclado para navegar por fotos subidas del vehículo o facturas a pantalla completa.
```
