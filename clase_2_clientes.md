# 📘 Clase 2: Conectando la UI con Supabase y TanStack Query

En esta fase del proyecto **Mecánica Pistón**, dimos el salto de tener una interfaz gráfica visualmente lista (con datos "falsos" o *mockeados*) a tener una aplicación funcional que interactúa con una base de datos real en la nube (**Supabase**).

A continuación, te explico los conceptos clave que implementamos y cómo funciona cada pieza del rompecabezas.

---

## 1. El Rol de Supabase (Nuestro Backend)

Supabase actúa como nuestro backend como servicio (BaaS). En lugar de escribir un servidor en Node.js o Python desde cero, Supabase nos da una base de datos PostgreSQL lista para usar y una API (a través del cliente `@supabase/supabase-js`) para interactuar con ella directamente desde React.

En nuestro archivo `src/lib/supabase.js`, inicializamos el cliente:
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```
Ese objeto `supabase` es nuestro "puente" hacia la nube. Lo usamos para hacer consultas como "dame todos los clientes" o "elimina el cliente con este ID".

---

## 2. TanStack Query (React Query): El Gestor de Estados Asíncronos

Cuando pedimos datos a un servidor, ese proceso toma tiempo. Durante ese tiempo, la interfaz necesita saber qué está pasando. ¿Está cargando? ¿Hubo un error? ¿Ya llegaron los datos?

Antes, solíamos usar `useState` y `useEffect` para esto, lo cual generaba mucho código repetitivo. **TanStack Query** resuelve esto de forma elegante proporcionando *Custom Hooks*.

Creamos nuestro propio archivo `src/hooks/useClientes.js` donde definimos **cinco hooks principales**:

### `useQuery` (Para LEER datos)
Usamos `useQuery` para obtener información (`useClientes` y `useCliente`). 
```javascript
export function useClientes() {
  return useQuery({
    queryKey: ['clientes'], // Una etiqueta única para estos datos
    queryFn: async () => {
      // La función que realmente va a buscar los datos a Supabase
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) throw error;
      return data;
    },
  });
}
```
**Ventajas:**
- **Caché automática:** Si cambias de página y vuelves, React Query mostrará los datos guardados en caché al instante mientras busca actualizaciones de fondo.
- Nos devuelve variables mágicas listas para usar: `data` (los clientes), `isLoading` (si está cargando) y `isError` (si falló).

### `useMutation` (Para ESCRIBIR, ACTUALIZAR o BORRAR datos)
A diferencia de `useQuery` que se ejecuta automáticamente al montar el componente, `useMutation` nos da una función que ejecutamos *solo cuando el usuario hace una acción* (ej. hacer clic en "Guardar").

```javascript
export function useCreateCliente() {
  const queryClient = useQueryClient(); // Acceso al gestor de caché
  
  return useMutation({
    mutationFn: async (nuevoCliente) => {
      // Inserta en Supabase
      const { data } = await supabase.from('clientes').insert([nuevoCliente]);
      return data;
    },
    onSuccess: () => {
      // Magia: Le decimos a React Query "Los clientes cambiaron, ve a buscarlos de nuevo"
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    }
  });
}
```
Ese `invalidateQueries` es crucial. Garantiza que después de crear un cliente, la lista en la pantalla se actualice sola, sin que tengamos que programar un recargo de la página ni actualizar estados manualmente.

---

## 3. Integración en los Componentes (UI)

Una vez que tuvimos los hooks, el trabajo en las páginas fue reemplazar la lógica "falsa" por los hooks reales.

### En `ClientesList.jsx`
1. Eliminamos el `useState` que tenía a "Juan Pérez" y "María Gómez".
2. Llamamos a nuestro hook: `const { data: clientes = [], isLoading, isError } = useClientes();`.
3. Usamos *Renderizado Condicional* (Render Conditional):
   - Si `isLoading` es verdadero, mostramos un spinner animado (icono `Loader2`).
   - Si `isError` es verdadero, mostramos un cartel rojo de alerta.
   - Si ninguna de las anteriores es verdadera, mostramos el mapa interactivo de las tarjetas de los clientes.

### En `ClienteNuevo.jsx` y `ClienteForm.jsx`
1. Instanciamos la mutación: `const createClienteMutation = useCreateCliente()`.
2. En la función `onSubmit`, en lugar de un `setTimeout` simulado, ahora usamos `await createClienteMutation.mutateAsync(data)`.
3. Pasamos el estado de la mutación `createClienteMutation.isPending` al componente `ClienteForm` para que el botón de "Guardar" se deshabilite y muestre "Guardando..." mientras la petición viaja por internet, previniendo que el usuario haga doble clic y cree dos clientes idénticos.

### En `ClienteDetail.jsx`
1. Tomamos el ID de la URL usando `useParams()`.
2. Buscamos el cliente específico: `const { data: cliente, isLoading } = useCliente(id)`.
3. Reemplazamos la fecha *hardcodeada* por la `created_at` real de la base de datos, usando la librería `date-fns` para formatearla a un formato amigable para el humano (`dd/MM/yyyy`).
4. Para eliminar, usamos el `useDeleteCliente()` y lo conectamos con el modal de confirmación (`ConfirmModal`), pasando su estado de carga (`isPending`) para bloquear el botón rojo de "Eliminar" y evitar cierres accidentales durante el proceso.

---

## 🎯 Conclusión de la Clase

Lo que logramos en esta fase es la **arquitectura estándar** que usarán todos los demás módulos de la aplicación (Vehículos, Órdenes, Pagos). 

Al separar la lógica de la base de datos en *Hooks*, logramos que nuestros componentes de UI (`ClientesList`, `ClienteForm`) permanezcan "limpios" y se enfoquen solo en dibujar la interfaz y reaccionar a los datos que les llegan, dejando el trabajo pesado de sincronización de estado y red a TanStack Query.
