# 👨‍🏫 Clase 13: Mejoras de UX (Toasts) y PWA

Para cerrar verdaderamente con broche de oro, implementamos dos de las características que más impacto tienen en la percepción de calidad de una aplicación: Feedback instantáneo y capacidad de instalación.

---

## 1. Notificaciones Elegantes (`sonner`)

Cuando un usuario presiona "Guardar", no es suficiente con mandarlo a otra pantalla. Psicológicamente, necesita una confirmación de que todo salió bien.

Instalamos una librería llamada `sonner` que hace exactamente eso.
En nuestro archivo base `App.jsx` colocamos el despachador de notificaciones:
```jsx
<Toaster richColors position="top-center" />
```

Y luego, en cualquier formulario (como `ClienteNuevo.jsx`), simplemente llamamos a la función `toast` justo antes de cambiar de página:
```javascript
const onSubmit = async (data) => {
  // Guardamos en la base de datos...
  await guardarEnBaseDeDatos(data);
  
  // Mostramos el mensaje verde de éxito
  toast.success('Cliente registrado correctamente');
  
  // Navegamos a la lista
  navigate('/clientes');
};
```
Esta pequeña mejora reduce drásticamente la ansiedad del usuario al usar el sistema.

---

## 2. Progressive Web App (PWA)

Una PWA es, en pocas palabras, una página web que engaña al teléfono para que crea que es una aplicación nativa. 

Configuramos el plugin `vite-plugin-pwa` en el archivo `vite.config.js`. Allí definimos el "Manifiesto" de la aplicación:
- **`name`**: Mecánica Pistón
- **`theme_color`**: `#000000` (Para que la barra de estado del celular se pinte de negro).
- **`icons`**: Le dijimos que use el `logo.png` que ya teníamos.

**¿Qué logramos con esto?**
Cuando el mecánico abra `http://localhost:5173` en su celular (o en el dominio final cuando lo publiquemos), el navegador le sugerirá: **"Agregar Mecánica Pistón a la pantalla de inicio"**. 
Al hacerlo, se creará un ícono como cualquier otra app, y al abrirla, desaparecerá la barra de direcciones del navegador (Safari/Chrome), viéndose exactamente igual que una aplicación de iOS o Android.

### ¡Pruébalo!
1. Ve a crear un Nuevo Cliente, llénalo y presiona Guardar. ¡Verás el hermoso mensaje verde caer desde arriba!
2. En tu navegador de PC (Chrome/Edge), si miras a la derecha de la barra de direcciones (donde escribes las URLs), verás un nuevo botoncito que dice "Instalar Mecánica Pistón". ¡Puedes instalarla en tu propia computadora!
