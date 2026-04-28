# 👨‍🏫 Clase 9: Lista de Órdenes y Filtros Combinados (ISSUE-13)

La página de Órdenes de Trabajo es posiblemente la pantalla que el mecánico más utilizará en su día a día. Por lo tanto, necesitábamos que sea muy robusta: un lugar donde pueda ver todas sus reparaciones y filtrarlas rápidamente.

---

## 1. Múltiples Estados de Filtro

A diferencia de la Lista de Clientes donde solo teníamos un buscador de texto, aquí introdujimos un nivel más de complejidad: **Pestañas de Estado**.

En React, para manejar varios filtros a la vez, usamos varios estados (`useState`):
```jsx
const [filtroTexto, setFiltroTexto] = useState('');
const [filtroEstado, setFiltroEstado] = useState('Todas');
```

Y luego combinamos ambos en una sola función gigante de filtrado (`.filter()`):
```javascript
const ordenesFiltradas = ordenes.filter(orden => {
  // 1. ¿El texto coincide?
  const coincideTexto = orden.cliente.includes(filtroTexto) || orden.vehiculo.includes(filtroTexto);

  // 2. ¿El estado coincide?
  let coincideEstado = true;
  if (filtroEstado === 'Abiertas') coincideEstado = orden.estado !== 'Terminado';
  else if (filtroEstado === 'Terminadas') coincideEstado = orden.estado === 'Terminado';

  // 3. Solo mostramos la orden si cumple AMBAS condiciones
  return coincideTexto && coincideEstado;
});
```
De esta manera, el mecánico puede seleccionar "Abiertas" y al mismo tiempo escribir "Toyota" en el buscador, y la lista mostrará únicamente los Toyotas que tengan órdenes abiertas.

---

## 2. El Desafío de las Tablas en Celulares

Una tabla clásica de Excel o HTML es el enemigo número uno de los celulares, porque no entran a lo ancho y obligan a deslizar de lado a lado (lo cual es muy incómodo).

Para solucionar esto, aplicamos un truco avanzado de Tailwind: **Cambiamos la tabla por una grilla CSS que muta en celular.**

```jsx
{/* Cabecera (Solo visible en PC) */}
<div className="hidden md:grid grid-cols-12 ..."> ... </div>

{/* Fila individual */}
<Link className="flex flex-col md:grid md:grid-cols-12 ...">
```

- **En Computadora (`md:grid md:grid-cols-12`):** La fila se comporta como una tabla estricta de 12 columnas. El cliente ocupa 3 columnas, el vehículo 4, etc. Todo queda perfectamente alineado.
- **En Celular (`flex flex-col`):** Las columnas estrictas desaparecen, y la información se apila hacia abajo de manera natural, convirtiendo cada "fila" de la tabla en una "tarjeta" (card) súper legible.

### ¡A jugar con los filtros!
1. Navega a `http://localhost:5173/ordenes`.
2. Juega con los tres botones de estado (Todas, Abiertas, Terminadas).
3. Prueba la búsqueda de texto.
4. Presiona F12 y simula un celular para ver cómo la tabla se "desarma" mágicamente para convertirse en un listado de tarjetas.
