# 👨‍🏫 Clase 5: Dashboard y Diseño Responsivo (ISSUE-08)

¡Totalmente de acuerdo! Como desarrollador Frontend, uno de los mayores desafíos es que la página se vea perfecta tanto en un monitor gigante (Ultra Wide) como en un celular de gama baja con pantalla pequeña (como un Moto G31). 

Para solucionar esto, he aplicado técnicas de **Diseño Responsivo Defensivo** tanto en la navegación que ya teníamos como en la nueva pantalla principal que acabamos de crear: **El Dashboard**.

---

## 1. Protegiendo el Layout y BottomNav (Pantallas extremas)

En `Layout.jsx`, teníamos un problema potencial: si alguien lo abría en un monitor Ultra Wide, el contenido se estiraría de punta a punta, viéndose horrible.

**Solución:** Usar `max-w-7xl mx-auto`.
- `max-w-7xl`: Le pone un límite de ancho máximo al contenido (1280px).
- `mx-auto`: Centra el contenido si la pantalla es más grande que 1280px. ¡Así nunca se deformará en monitores gigantes!

En `BottomNav.jsx`, si el usuario tenía un celular muy angosto, los botones podían "aplastarse" unos con otros.
**Solución:** Usar `flex-1` y `shrink-0`.
- Cambié el ancho fijo de los botones por `flex-1`, lo que hace que se repartan el espacio disponible equitativamente, no importa qué tan chica sea la pantalla.
- Al botón central grande le puse `shrink-0` (no te encojas). Esto garantiza que, aunque la pantalla sea enana, el botón principal nunca perderá su forma circular perfecta.

---

## 2. El Nuevo Dashboard (`Dashboard.jsx`)

Creamos la página principal del taller. Aquí el mecánico verá un resumen rápido apenas inicie sesión.

### 📊 Grilla de Tarjetas (Cards)
Usamos CSS Grid para acomodar las tarjetas de métricas mágicamente según la pantalla:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
```
- **Celular chico (`grid-cols-1`):** Muestra una tarjeta debajo de otra.
- **Tablet (`sm:grid-cols-2`):** Muestra dos columnas.
- **PC (`md:grid-cols-3`):** Muestra las tres tarjetas una al lado de la otra.

### 🛡️ Truncado de Texto (Protección extrema)
En las tarjetas usamos la clase `truncate` y `overflow-hidden`:
```jsx
<p className="text-2xl font-black text-neutral-900 truncate">{stat.value}</p>
```
Si por algún motivo el mecánico tiene "100.000.000" de clientes, el número no romperá la tarjeta ni se saldrá de los bordes. En su lugar, se mostrará "100.000...". Esto es vital para que la app no se rompa nunca.

### 📋 Lista de Últimas Órdenes
Construimos una lista con los últimos vehículos que ingresaron. Aquí aplicamos un diseño Flexbox que también cambia de forma:
```jsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
```
- En PC (`sm:flex-row`), la información del auto y su estado ("Terminado", "En proceso") están en la misma línea.
- En celular (`flex-col`), el estado se mueve abajo para no apretujar la pantalla y que el texto no se monte encima del otro.

### ¡A probar el Dashboard!
Si vas a `http://localhost:5173/`, ya deberías ver el Dashboard funcionando (la información es "mock", es decir, de mentira, hasta que Juan nos conecte la base de datos). 

**Prueba de fuego:** Achica y agranda la ventana de tu navegador, o usa la vista de celulares (F12) y elige un iPhone SE (muy chiquito) y luego un monitor grande. ¡Verás cómo toda la interfaz se acomoda sola de forma fluida!
