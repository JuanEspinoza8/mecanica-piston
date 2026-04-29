# 👨‍🏫 Clase 1: Creando el Layout Principal (ISSUE-05)

¡Hola Lucas! Empezamos con tu primera tarea asignada: el **Layout Principal**. 

Primero, creamos una nueva rama (branch) usando el comando `git checkout -b feature/ISSUE-05-layout-principal`. Esto es una buena práctica para no romper la rama principal (`main`) mientras desarrollamos nuestra funcionalidad.

A continuación, te explico paso a paso lo que hicimos y por qué.

---

## 1. ¿Qué es un Layout?

En desarrollo web, un **Layout** es la estructura o "molde" que envuelve a todas las páginas de tu aplicación. 
Imagínate que todas las pantallas de tu sistema van a tener la misma barra lateral (Sidebar) y la misma barra superior (Header). En lugar de copiar y pegar ese código en cada página, creamos un componente `Layout` que contiene todo eso, y en el centro dejamos un "hueco" donde se irá cargando el contenido de cada página específica (Dashboard, Clientes, Órdenes).

A ese "hueco" en React lo llamamos `children`.

---

## 2. El Componente `Layout.jsx` línea por línea

Creamos el archivo en `src/components/Layout.jsx`. Vamos a ver qué hace cada parte:

```jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, ClipboardList, Wrench, Search } from 'lucide-react';
```
* **¿Por qué importamos esto?** 
  * `Link`: Es como la etiqueta `<a>` de HTML, pero para React Router. Permite navegar sin recargar toda la página.
  * `useLocation`: Un "gancho" (hook) que nos dice en qué URL estamos actualmente (ej: `/clientes`). Lo usamos para pintar de azul el botón del menú donde nos encontramos.
  * `Home, Users...`: Son los iconos que importamos de la librería `lucide-react`.

```jsx
export default function Layout({ children }) {
  const location = useLocation();
```
* Definimos nuestro componente `Layout`. Fíjate que recibe `{ children }`. Esto representa a cualquier componente que pongamos "adentro" de este Layout.

```jsx
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Clientes', path: '/clientes', icon: Users },
    { name: 'Órdenes', path: '/ordenes', icon: ClipboardList },
  ];
```
* Guardamos los botones de nuestro menú en un arreglo (`array`). Así, si mañana queremos agregar un nuevo botón, solo lo sumamos a esta lista y se dibuja automáticamente.

```jsx
  return (
    <div className="flex h-screen bg-slate-50">
```
* **Contenedor padre:** Usamos Tailwind CSS. 
  * `flex`: activa flexbox para acomodar cosas una al lado de la otra.
  * `h-screen`: le dice que ocupe el 100% del alto de la pantalla.
  * `bg-slate-50`: le pone un color de fondo gris muy clarito.

### El Sidebar (Barra Lateral)

```jsx
      {/* Sidebar (Solo en Desktop) */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-slate-300 md:flex">
```
* `aside`: etiqueta HTML para contenido lateral.
* `hidden`: por defecto (en celulares) lo ocultamos.
* `md:flex`: cuando la pantalla sea mediana (`md` = tablet/desktop en adelante), lo mostramos. Esto es el diseño **Mobile-First**.
* `w-64`: ancho fijo de la barra.
* `bg-slate-900`: fondo azul súper oscuro (casi negro).

Dentro del sidebar tenemos el Logo y mapeamos (`.map()`) nuestros `navItems` para crear los enlaces:

```jsx
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link ... className={isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}>
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
```
* **La lógica de `isActive`:** Compara si la ruta de la web actual (`location.pathname`) coincide con la del botón. Si es así, le da un fondo azul (`bg-blue-600`), indicando visualmente que estamos ahí.

### El Contenedor Derecho (Header + Contenido)

```jsx
      {/* Contenedor Principal (Header + Contenido) */}
      <div className="flex flex-1 flex-col overflow-hidden">
```
* `flex-1`: le dice a este contenedor que ocupe todo el espacio sobrante a la derecha del Sidebar.
* `flex-col`: para que el Header quede arriba y el contenido caiga abajo.

```jsx
        <header className="flex h-16 items-center justify-between bg-white px-4 shadow-sm md:px-6">
          {/* Logo visible solo en mobile */}
          <div className="flex items-center md:hidden"> ... </div>
          
          {/* Barra de búsqueda visible solo en desktop */}
          <div className="hidden max-w-xl flex-1 md:block"> ... </div>
        </header>
```
* El `header` tiene una altura de `h-16` y fondo blanco con una pequeña sombra (`shadow-sm`).
* Fíjate cómo jugamos con `hidden` y `md:block` / `md:hidden` para decidir qué cosas se ven en el celular y qué cosas en la computadora. En el celular mostramos el título arriba, pero en PC lo ocultamos porque ya está en la barra lateral.

```jsx
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```
* `main`: aquí es donde vive la magia. `overflow-y-auto` significa que si el contenido es muy largo, aparecerá una barra de scroll **solo en esta sección**, dejando el Sidebar y el Header siempre quietos.
* `{children}`: aquí aparecerá nuestra lista de clientes, la información del vehículo, etc., dependiendo de en qué página estemos.

---

## 3. Integrando el Layout en la App

Finalmente, fuimos a `src/App.jsx` e hicimos este cambio:

```diff
  import { routes } from './routes'
+ import Layout from './components/Layout'

  function App() {
    return (
+     <Layout>
        <Suspense fallback={...}>
          <Routes> ... </Routes>
        </Suspense>
+     </Layout>
    )
  }
```

* **¿Por qué?** Importamos nuestro nuevo componente `Layout` y "abrazamos" a todas nuestras rutas con él. De esta manera, sin importar a qué ruta vayamos (`/`, `/clientes`, `/ordenes`), el Layout siempre se va a renderizar, y las rutas se mostrarán justo donde pusimos la variable `{children}`.

### Próximos pasos
Ya puedes ejecutar `npm run dev` en tu consola para ver cómo va quedando. ¡Vas a ver la estructura base con el menú lateral en tu computadora! 

La siguiente tarea de tu lista sería hacer el menú inferior (`BottomNav`) para que cuando abramos la app en un celular, podamos navegar cómodamente.
