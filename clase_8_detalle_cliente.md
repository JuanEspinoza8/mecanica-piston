# 👨‍🏫 Clase 8: Detalle del Cliente y Parámetros URL (ISSUE-12)

Cada cliente en la base de datos tiene un ID único. Cuando hacemos clic en un cliente desde la lista, navegamos a una página especial, por ejemplo: `/clientes/1` o `/clientes/2`. 

La gran pregunta es: ¿Cómo sabe React qué cliente debe mostrar en pantalla si usamos el mismo componente `ClienteDetail.jsx` para todos?

---

## 1. El uso de `useParams`

En `src/routes.jsx`, configuramos la ruta de esta manera: `path: '/clientes/:id'`. 
Ese `:id` (con dos puntos) significa que es una variable dinámica. Puede ser cualquier cosa.

Dentro de `ClienteDetail.jsx`, capturamos ese valor mágico usando un Hook de React Router llamado `useParams`:

```jsx
import { useParams } from 'react-router-dom';

export default function ClienteDetail() {
  const { id } = useParams();
  
  // Con este "id", en el futuro Juan hará una petición a la base de datos:
  // const cliente = await supabase.from('clientes').select().eq('id', id)
}
```
Así de fácil, ya sabemos exactamente a qué cliente le hizo clic el usuario.

---

## 2. Jerarquía de Información (Diseño Visual)

Cuando tienes una página que muestra muchos datos (como el perfil del cliente y todos sus vehículos), el mayor desafío de diseño es no abrumar al usuario. Usamos el concepto de **Jerarquía Visual**:

1. **Lo más importante:** El nombre del cliente. Lo pusimos enorme (`text-3xl font-black`) para que sea lo primero que leas.
2. **Lo secundario (pero vital):** Su contacto. Agrupamos Teléfono, Email y Dirección en pequeñas cajitas grises (`bg-neutral-50 p-3 rounded-xl`) con íconos rojos, para que sean fáciles de escanear visualmente.
3. **Las Colecciones:** Separamos totalmente la sección de los datos del cliente de la sección de sus "Vehículos" con una línea divisoria (`<hr>`).

---

## 3. Tarjetas de Vehículos Interactivas

Para listar los autos que este cliente tiene registrados en el taller, diseñamos tarjetas interactivas:

```jsx
<div className="inline-block bg-black text-white text-xs font-bold px-3 py-1 rounded-md tracking-widest mb-2 shadow-sm">
  {vehiculo.patente}
</div>
```
- Usamos un formato que parece literalmente una **matrícula o patente real** (letras blancas, fondo negro, espaciado ancho `tracking-widest`).
- Al pasar el mouse por encima de toda la tarjeta del vehículo, el texto principal se vuelve rojo y la flecha cambia de gris claro a rojo para indicar claramente "¡Hey, puedes hacer clic aquí para entrar al detalle del auto!".

### ¡A probarlo!
1. Ve a `http://localhost:5173/clientes`.
2. Haz clic en cualquiera de las tarjetas de los clientes.
3. Te llevará a la ruta dinámica (`/clientes/1`) y verás la hermosa pantalla de detalle junto con sus vehículos de muestra.
