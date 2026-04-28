# 👨‍🏫 Clase 10: Dashboards Complejos y Grid Layout (ISSUE-15)

Llegamos al corazón de la aplicación: La página de Detalle de Orden (`OrdenDetail.jsx`). 

Esta es la pantalla que el mecánico tendrá abierta mientras arregla el auto. Necesita ver al cliente, el vehículo, las tareas que tiene que hacer, sacar fotos y ver cuánto va gastando en repuestos. 
¡Es mucha información para meter en una sola pantalla!

---

## 1. El poder de CSS Grid en Paneles Complejos

Cuando tenemos secciones independientes (como Tareas por un lado y Repuestos por otro), Flexbox suele quedarse corto. Aquí es donde **CSS Grid** brilla.

Dividimos la pantalla principal en 3 columnas virtuales:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  
  {/* Columna Izquierda (Ocupa 2 espacios) */}
  <div className="lg:col-span-2 space-y-6">
    {/* Tareas, Fotos, Síntoma */}
  </div>

  {/* Columna Derecha (Ocupa 1 espacio) */}
  <div className="space-y-6">
    {/* Repuestos y Total monetario */}
  </div>

</div>
```

**¿Por qué lo hicimos así?**
- En celulares (`grid-cols-1`): Todo se apila de forma tradicional. Primero las tareas, y al final los repuestos.
- En pantallas grandes (`lg:grid-cols-3`): Dividimos el espacio en un 66% para el trabajo rústico (tareas y fotos) y dejamos una barra lateral del 33% dedicada exclusivamente a los números y repuestos. Es exactamente como funcionan aplicaciones profesionales como Jira, Trello o los sistemas de facturación.

---

## 2. Componentización Visual (Cajas dentro de cajas)

Para evitar que todo parezca un muro de texto aburrido, cada "módulo" vive dentro de su propia tarjeta (card) blanca con bordes redondeados y una sutil sombra (`bg-white rounded-2xl shadow-sm`).

Además, usamos colores para dar contexto rápidamente sin tener que leer:
- **Síntoma / Motivo de Ingreso:** Le dimos un fondo rojo claro (`bg-red-50/50 text-red-800`). El rojo atrae el ojo inmediatamente, recordando al mecánico cuál es el problema principal por el que el cliente trajo el auto.
- **Total de Repuestos:** A diferencia de todo el resto de la web que es blanca, la caja de "Total" abajo a la derecha es totalmente negra (`bg-black text-white`) con los números en rojo vibrante. ¡Imposible no ver cuánto se está gastando!

---

## 3. Estados Dinámicos en Listas (El "Tachado")

En la lista de "Tareas a Realizar", notarás que las tareas que están marcadas como "Terminado" se ven un poco diferentes a las demás:

```jsx
<span className={`font-medium ${tarea.estado === 'Terminado' ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
  {tarea.descripcion}
</span>
```
Esta pequeña lógica pregunta: "¿El estado es Terminado?". Si es así, le aplica la clase `line-through` (tachado) y le baja el color a gris claro (`text-neutral-400`). Esto le da una respuesta psicológica súper satisfactoria al mecánico, sintiendo que de verdad "tachó" algo de su lista.

### ¡A revisar la Orden!
1. Navega a `http://localhost:5173/ordenes`.
2. Haz clic en cualquiera de las órdenes (ejemplo: ORD-001 o la de Juan Pérez).
3. Disfruta del diseño del panel de control. Revisa cómo se destacan los precios, el síntoma y el botón para subir fotos.
