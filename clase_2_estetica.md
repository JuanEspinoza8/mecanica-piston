# 👨‍🏫 Clase 2: Estética, interactividad y nuestra Identidad Visual

¡Excelente observación! Un buen sistema no solo tiene que funcionar, sino que tiene que verse profesional, moderno y alineado con la marca de la empresa.

Me pediste un diseño en **negro y rojo**, con un aspecto interactivo, intuitivo y, por supuesto, **el logo del pistón**. 

## 1. Integrando el Logo

Primero, generé un logo vectorial de un pistón usando IA y lo guardé en la carpeta `public/` de nuestro proyecto con el nombre `logo.png`. 

La carpeta `public/` en Vite/React es especial: cualquier imagen que pongas ahí se puede llamar directamente en el código usando la ruta `/nombre.png`.

En nuestro `Layout.jsx`, agregamos esto en la parte del Sidebar y del Header:

```jsx
<img 
  src="/logo.png" 
  alt="Pistón Logo" 
  className="mr-3 h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
/>
<span className="text-xl tracking-tight uppercase">
  Mecánica <span className="text-red-600 font-black">Pistón</span>
</span>
```

**Explicación de Tailwind:**
- `object-contain`: Asegura que el logo mantenga su proporción sin deformarse.
- `drop-shadow-[...]`: Aquí inyectamos una sombra personalizada (`rgba(239,68,68,0.5)` es color rojo con 50% de transparencia). Esto le da un brillo rojizo sutil estilo "neón" que lo hace destacar sobre el fondo negro.
- `uppercase` y `font-black`: Hacemos que el texto sea todo mayúsculas y súper grueso, para darle un look "industrial" e imponente.

---

## 2. Paleta de Colores: Negro y Rojo

Cambiamos los fondos azules y grises aburridos por una paleta de colores agresiva y moderna.

* **El Sidebar:** Ahora tiene `bg-black` (fondo negro total).
* **Los botones activos:** En lugar de un color sólido, usamos un **degradado** (gradient).
  ```jsx
  'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30'
  ```
  Esto significa: "Fondo con gradiente de izquierda a derecha (`to-r`), yendo de un rojo encendido a uno más oscuro, con una sombra roja difuminada abajo". Da un efecto "premium".

---

## 3. Micro-interacciones (Haciéndolo "Vivo")

Me pediste que sea interactivo. En web moderna, esto se logra con "hover effects" (lo que pasa cuando pasas el mouse por encima) y animaciones suaves.

Mira la clase de los botones inactivos:
```jsx
'hover:bg-neutral-900 hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out'
```
* `hover:translate-x-1`: Cuando pones el mouse encima, el botón se mueve 4 píxeles a la derecha de forma fluida. ¡Pruébalo!
* `transition-all duration-300`: Le decimos que cualquier cambio (de color o movimiento) no sea brusco, sino que tarde 300 milisegundos en completarse suavemente.

También animamos los iconos:
```jsx
<Icon className={`mr-3 h-5 w-5 transition-transform duration-300 ${
  isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-red-500'
}`} />
```
* `group-hover:scale-110`: Esto es un truco avanzado de Tailwind. Agrupamos el botón (`group`) y le decimos al ícono que cuando se haga hover *en cualquier parte del botón*, el ícono debe crecer un 10% (`scale-110`) y pintarse de rojo.

---

## 4. La Barra de Búsqueda (Input Interactivo)

En la parte superior agregamos el buscador. Todavía no busca de verdad, pero ya tiene el diseño interactivo:

```jsx
<div className="group flex ... transition-all focus-within:border-red-500 focus-within:shadow-md focus-within:shadow-red-500/10">
  <Search className="group-focus-within:text-red-500 transition-colors" />
  <input className="outline-none bg-transparent" />
</div>
```
* `focus-within`: Significa "cuando el usuario haga clic adentro de este contenedor para escribir". En ese momento, los bordes se vuelven rojos, aparece una sombra suave roja, y el ícono de la lupita cambia de color gris a rojo.

### ¡Ve a probarlo!
Mira tu navegador (`http://localhost:5173/` si dejaste corriendo `npm run dev`) y fíjate cómo quedó. Pasa el mouse por los botones y haz clic en la barra de búsqueda para ver los efectos.
