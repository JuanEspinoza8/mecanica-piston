# 👨‍🏫 Clase 3: Navegación Móvil (BottomNav)

¡Sigamos avanzando! Acabamos de completar la tarea `ISSUE-06`, que consistía en crear una barra de navegación inferior exclusiva para celulares. 

En aplicaciones web modernas (PWA), cuando el usuario entra desde un celular, la barra lateral izquierda (Sidebar) ocupa demasiado espacio, por lo que la ocultamos y en su lugar mostramos una barra inferior, igual a la que tienen Instagram o WhatsApp.

---

## 1. El Componente `BottomNav.jsx`

Creamos un nuevo archivo `src/components/BottomNav.jsx`. Aquí están las claves principales de este componente:

```jsx
<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-neutral-900 pb-safe">
```

**Explicación de clases de Tailwind:**
- `md:hidden`: Esto es magia. Significa "Ocultar este elemento en pantallas medianas o grandes". Así nos aseguramos de que solo se vea en el celular.
- `fixed bottom-0 left-0 right-0`: Lo anclamos permanentemente al fondo de la pantalla, ocupando todo el ancho.
- `z-50`: Nos aseguramos de que siempre esté por encima de cualquier otro contenido.
- `pb-safe`: Es una buena práctica para iPhone, evita que la barra se superponga con la barrita blanca de inicio de iOS.

---

## 2. El Botón Flotante Central (Call to Action)

En lugar de hacer que todos los botones sean iguales, hicimos que el botón de **"Nueva Orden"** destaque muchísimo. Esto se llama *Call to Action* (Llamada a la acción), porque queremos que sea lo más rápido de apretar para el mecánico.

```jsx
<div className="flex flex-col items-center justify-center w-16">
  <Link 
    to="/ordenes/nueva" 
    className="absolute -top-6 flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-red-600 to-red-700 shadow-[0_4px_15px_rgba(220,38,38,0.5)] text-white transform transition-transform active:scale-95 border-4 border-neutral-100"
  >
    <Plus className="h-8 w-8" />
  </Link>
  <span className="text-[10px] font-medium tracking-wide text-neutral-500 mt-8">Nueva</span>
</div>
```

**¿Por qué está diseñado así?**
- `absolute -top-6`: Hace que el botón se "salga" de la barra hacia arriba, rompiendo la línea recta y dándole un look de app nativa.
- `border-4 border-neutral-100`: Le pone un borde blanco grueso alrededor para separarlo del fondo negro y que resalte más.
- `active:scale-95`: Cuando tocas el botón con el dedo, se encoge un 5%, dando una respuesta táctil súper satisfactoria.

---

## 3. Ajustando el Layout

Al poner una barra fija en la parte inferior, teníamos un problema: ¡La barra tapaba el contenido del final de la página!

Para solucionarlo, modificamos `src/components/Layout.jsx`:

```diff
- <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-neutral-50/50">
+ <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8 bg-neutral-50/50">
```

Agregamos `pb-24` (padding-bottom). Esto empuja el contenido hacia arriba en celulares para dejar un espacio vacío justo donde va la barra, asegurando que el usuario pueda scrollear hasta el final sin que nada se le tape.

### ¡Pruébalo!
Entra a `http://localhost:5173/`. 
1. Si estás en la PC, **no vas a ver la barra inferior**.
2. **Para probarlo:** Haz clic derecho en la página -> Inspeccionar (o presiona F12). Arriba a la izquierda de la consola que se abre, hay un ícono de un celular y una tablet. Haz clic ahí para simular la vista móvil y actualiza la página... ¡Aparecerá nuestra nueva barra de navegación inferior!
