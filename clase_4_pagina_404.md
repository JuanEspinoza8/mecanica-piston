# 👨‍🏫 Clase 4: Página de Error 404 (ISSUE-07)

¡Buena idea! Aprovechando que la temática de nuestro software es sobre un taller mecánico, la página de error 404 (que aparece cuando alguien entra a un enlace que no existe) es el lugar perfecto para ponerle un poco de humor y personalidad al sistema.

---

## 1. El Ícono Personalizado

Tal como sugeriste, usé nuestra IA generadora de imágenes para crear un ícono de **un engranaje o motor roto y humeante**, siguiendo la estética minimalista de la aplicación (solo negro y rojo). 

Guardamos esa imagen en `public/404-icon.png` para poder usarla fácilmente.

---

## 2. El Componente `NotFound.jsx`

En la carpeta `src/pages/`, teníamos un archivo base vacío para el error 404. Lo hemos reconstruido por completo. Aquí está lo más destacado del código:

### ⚙️ El diseño de la página
```jsx
<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
```
Centramos absolutamente todo el contenido en la pantalla, tanto vertical (`items-center`) como horizontalmente (`justify-center`), y le dimos una altura mínima del 70% de la pantalla (`min-h-[70vh]`).

### 🖼️ La Imagen (con animación)
```jsx
<img 
  src="/404-icon.png" 
  alt="Engranaje Roto" 
  className="w-48 h-48 md:w-64 md:h-64 object-contain mb-8 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse" 
/>
```
**¿Qué hicimos aquí?**
- `md:w-64 md:h-64`: En celulares será de tamaño 48 (192px) y en PC crecerá a tamaño 64 (256px).
- `animate-pulse`: Esta es una clase nativa de Tailwind muy genial. Hace que el ícono parezca "palpitar" o titilar suavemente (sube y baja su opacidad), dando la sensación de alerta o de que algo está funcionando mal.
- `drop-shadow`: Le agregamos ese brillo rojo estilo neón que usamos en el logo de la barra principal.

### 📝 El Texto Temático
En lugar de poner un aburrido "Página no encontrada", usamos la jerga de los mecánicos:
```jsx
<h2 className="text-2xl font-bold text-neutral-800 mb-4">
  ¡Ups! Parece que fundimos motor.
</h2>
<p className="text-neutral-500 max-w-md mb-10">
  La página que estás buscando no existe, fue movida o el enlace está roto. Mejor volvamos al taller antes de que empeore.
</p>
```

### 🔘 El Botón de Rescate
Por último, siempre hay que darle al usuario una forma de escapar de un error. Le pusimos un botón grande y claro para volver al "Dashboard":
```jsx
<Link 
  to="/" 
  className="group flex items-center justify-center bg-black hover:bg-neutral-900 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
>
  <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
  Volver al Inicio
</Link>
```
Nuevamente usamos las interacciones de `group-hover`. Cuando pasas el mouse por el botón, el ícono de la flechita (`ArrowLeft`) se mueve hacia la izquierda para indicarte la acción de "regresar".

### ¡Prueba romper el sistema!
Si escribes una URL cualquiera que no exista, como `http://localhost:5173/cualquier-cosa`, React Router se dará cuenta de que la ruta no existe y cargará automáticamente este nuevo componente. ¡Pruébalo y mira la animación del engranaje!
