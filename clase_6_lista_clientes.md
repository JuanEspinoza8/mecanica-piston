# 👨‍🏫 Clase 6: Página de Clientes y Estados Vacíos (ISSUE-10)

¡Bienvenido a la Fase 2 del proyecto! En esta etapa empezamos a meternos con las páginas de datos reales. 
La primera tarea de esta fase era crear la página `ClientesList.jsx` donde veremos a todos los dueños de los vehículos.

---

## 1. Datos Falsos (Mock Data) vs Datos Reales

Como Juan todavía está trabajando en la base de datos y los "Hooks" (las conexiones a esa base de datos), nosotros como Frontend Developers no podemos quedarnos de brazos cruzados.

Lo que hacemos es crear un arreglo (array) con datos simulados:
```jsx
const [clientes] = useState([
  { id: 1, nombre: 'Juan Pérez', telefono: '+54 11 1234-5678', vehiculos: 2 },
  { id: 2, nombre: 'María Gómez', telefono: '+54 11 9876-5432', vehiculos: 1 },
]);
```
Cuando Juan termine su parte, simplemente cambiaremos esta línea por su código (`const { data: clientes } = useClientes();`) y **todo nuestro diseño seguirá funcionando mágicamente sin cambiar nada más**.

---

## 2. Buscador en Tiempo Real (Filtro Local)

Le agregamos un input de búsqueda con un ícono de lupita. ¿Cómo funciona?

1. Guardamos lo que el usuario escribe en una variable llamada `filtro`.
2. Usamos la función `.filter()` de JavaScript para filtrar nuestra lista de clientes en tiempo real.

```jsx
const clientesFiltrados = clientes.filter(c => 
  c.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
  c.telefono.includes(filtro)
);
```
**Traducción:** "Dime qué clientes tienen el texto de la variable `filtro` incluido en su nombre (ignorando mayúsculas) o en su teléfono".

Al escribir en la caja de búsqueda, verás cómo las tarjetas de clientes desaparecen instantáneamente. ¡Pruébalo!

---

## 3. Estados Vacíos (Empty States)

¿Qué pasa si el mecánico entra a la app y todavía no tiene ningún cliente registrado? ¿O qué pasa si busca el nombre "Godzilla" y obviamente no hay resultados?

Si simplemente no mostramos nada, el usuario pensará que la app se rompió. Por eso diseñamos un **"Estado Vacío"**:

```jsx
{clientesFiltrados.length === 0 ? (
  // Dibuja un ícono gris gigante con el texto "No se encontraron clientes"
  <div className="bg-white rounded-2xl ...">
) : (
  // Dibuja las tarjetas de los clientes
  <div className="grid ...">
)}
```
Este bloque de código se lee así: **Si la cantidad de clientes filtrados es cero, muestra el cartel amigable. Sino (caso contrario), muestra la grilla de clientes.**

---

## 4. Efectos Hover Avanzados (El borde rojo)

Si miras las tarjetas de los clientes, al pasar el mouse por encima (`hover`), aparece una barrita roja en el borde izquierdo y la flechita de la derecha se pinta de rojo y se mueve ligeramente.

Esto se logra con el modificador `group` de Tailwind:
- A toda la tarjeta le pusimos la clase `group relative`.
- A la barrita roja (que es invisible por defecto) le pusimos `absolute top-0 left-0 w-1 h-full bg-red-500 opacity-0 group-hover:opacity-100`.
- Esto significa: "Cuando alguien ponga el mouse sobre mi padre (el grupo), mi opacidad pasará a ser del 100% y me haré visible".

### ¡Prueba la página!
1. Navega a `http://localhost:5173/clientes` (haciendo clic en "Clientes" en tu menú).
2. Usa el buscador interno (escribe "María" o "4567").
3. Escribe algo que no exista (como "Zebra") para ver cómo reacciona el Estado Vacío.
