# 👨‍🏫 Clase 14: Dark Mode, Buscador y Prevención de Errores

En esta fase dimos un salto de calidad increíble. Implementamos funciones "Premium" que elevan la categoría de Mecánica Pistón a una aplicación de nivel empresarial.

## 🌙 1. Modo Oscuro (Dark Mode) "Taller Nocturno"

Pocas cosas dicen "profesional" tanto como un buen tema oscuro. Configurar Dark Mode en Tailwind es sencillo en teoría, pero laborioso en la práctica.

1. **Configuración Inicial:** En `tailwind.config.js` agregamos `darkMode: 'class'`. Esto significa que si el elemento `<html>` tiene la clase `dark`, Tailwind aplicará los colores oscuros.
2. **Estado Global con Zustand:** Creamos un "Store" en `src/store/useAppStore.js`. Zustand nos permite guardar variables (como si está prendido o apagado el tema oscuro) y acceder a ellas desde **cualquier archivo** sin tener que pasar propiedades (`props`) de componente en componente. Además usamos su middleware `persist` para que la elección se guarde en el `localStorage` del navegador.
3. **Pintando con Clases `dark:`:** Recorrimos todos nuestros componentes y les agregamos clases como `dark:bg-neutral-900` (fondo gris muy oscuro), `dark:text-white` (letras blancas), y `dark:border-red-600/30` para darle esos sutiles toques en rojo "neón" que pediste para la estética de taller.

## 🔍 2. Buscador Global

Teníamos una barra de búsqueda de adorno, ahora es funcional.
- Creamos el componente `GlobalSearch.jsx`.
- Se abre presionando el botón "Buscar" (o la lupa en el celular).
- Tiene lógica de filtrado en tiempo real usando los datos "Mock" (falsos) que veníamos manejando.
- **Detalle Pro:** Si presionas la tecla `Escape` (Esc), el buscador se cierra automáticamente. 

## ⚠️ 3. Modal de Confirmación

Cuando trabajemos con base de datos, borrar un cliente por accidente sería catastrófico.
- Diseñamos `ConfirmModal.jsx`. Un componente que oscurece el fondo y pide confirmación expresa.
- Tiene estética agresiva (Rojo y Negro).
- **¿Cómo probarlo?** Ve a la lista de Clientes, entra al perfil de "Juan Pérez" y presiona el botón rojo de "Eliminar". ¡Verás el modal en acción!


---

## 🚀 Resumen para tu Pull Request (GitHub)

Copia y pega este bloque en GitHub cuando crees tu Pull Request hacia `develop`:

```markdown
### 🚀 Novedades: "Taller Nocturno", Buscador y Seguridad

En esta iteración de Frontend he implementado tres características críticas para la experiencia de usuario:

1. 🌙 **Dark Mode (Taller Nocturno):** Implementación completa de un tema oscuro diseñado específicamente para ambientes de poca luz. Utiliza fondos oscuros de alto contraste con acentos en rojo intenso (Pistón Red) para mantener la identidad visual. Se controla mediante un botón en el menú de navegación con persistencia local.
2. 🔍 **Buscador Global Inteligente:** El buscador de la barra superior ahora está funcional. Al escribir, despliega un panel flotante de resultados rápidos buscando en tiempo real a través de clientes y vehículos (usando mock data), permitiendo navegación ultra-rápida.
3. ⚠️ **Modales de Prevención:** Creación de un componente reutilizable `<ConfirmModal />`. Está diseñado para interceptar acciones destructivas (como "Eliminar Cliente") con un diseño de alerta rojo y negro, dejando todo preparado para que el equipo de Backend solo tenga que inyectar las funciones de borrado de Supabase.
```
