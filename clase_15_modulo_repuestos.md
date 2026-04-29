# 👨‍🏫 Clase 15: Módulo de Repuestos (Interactividad y Archivos)

En esta sesión dimos vida al panel de "Repuestos y Costos" dentro del Detalle de la Orden de Trabajo. Pasó de ser un simple bloque visual a un módulo completamente interactivo.

## 📦 1. Gestión de Estado Compleja (`useState`)
Antes, los repuestos eran una lista estática (un mock pegado en el código). Ahora, convertimos esa lista en un **estado interactivo** en React usando `useState(ordenMock.repuestosIniciales)`. Esto significa que React "observa" esta lista; si agregamos o quitamos un repuesto, la interfaz se repinta automáticamente.

- **Cálculos automáticos:** Utilizamos `reduce()` para recorrer la lista de repuestos y multiplicar `precio * cantidad`. Cada vez que cambia el estado, el "Total Estimado" se actualiza al instante en pantalla sin recargar la página.
- **Eliminación:** Agregamos un botón de 🗑️ (papelera) que aparece al hacer `hover` sobre un repuesto. Al presionarlo, utilizamos la función `filter()` para eliminar el repuesto de nuestro estado global y recalcular el costo.

## 📎 2. Modal y Subida de Archivos
Creamos el componente `<AddRepuestoModal />`.
- Utiliza **React Hook Form** y **Zod** para validar que no puedas ingresar un repuesto sin nombre, o con precio negativo.
- **Input de Archivo (UI):** Ocultamos el aburrido input tradicional de `<input type="file" />` y diseñamos un área de "Drag & Drop / Clic" muy estética. 
- Cuando seleccionas un archivo (ej: una factura en PDF o foto del recibo), mostramos el nombre del archivo en color rojo. Al guardar, el repuesto en la lista muestra un ícono indicando que tiene un archivo adjunto. (La subida real a la nube la hará el Backend próximamente).

## 🌙 3. Pulido de Dark Mode
Finalizamos los detalles del modo "Taller Nocturno" en todas las vistas, incluyendo el nuevo Modal de repuestos y las pantallas de Detalle de Órdenes.

---

## 🚀 Resumen para tu Pull Request (GitHub)

Copia este texto cuando hagas el Pull Request hacia `develop`:

```markdown
### 🚀 Novedades: Módulo Dinámico de Repuestos y Costos

En esta rama (`feature/modulo-repuestos`) he implementado la lógica interactiva para la gestión económica de las órdenes de trabajo.

1. **Gestión de Estado y Cálculos en Tiempo Real:** La lista de repuestos en el detalle de la orden ahora es dinámica. Se pueden eliminar items con un clic y el sistema recalcula automáticamente el subtotal y el "Total Estimado".
2. **Modal de Añadir Repuesto:** Se desarrolló un nuevo componente `<AddRepuestoModal />` con validación estricta de formularios (Zod). 
3. **Subida de Comprobantes (UI):** Se diseñó una interfaz personalizada para adjuntar archivos (PDF/Imágenes) en el modal de repuestos. La UI simula la carga y vincula visualmente el archivo al repuesto en la lista, preparando el terreno para la integración con el Storage del Backend.
4. **Fixes de Dark Mode:** Se resolvieron bugs de visibilidad en los encabezados de las vistas de creación (Nuevo Cliente/Vehículo/Orden) y se aplicó el tema oscuro completamente al detalle de las órdenes.
```
