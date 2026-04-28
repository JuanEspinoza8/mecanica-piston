# 👨‍🏫 Clase 7: Formularios Profesionales con React Hook Form y Zod (ISSUE-11)

Manejar formularios en la web siempre fue un dolor de cabeza: controlar lo que el usuario escribe, mostrar mensajes de error, evitar que manden formularios vacíos... 
Para no volvernos locos, en este proyecto instalamos dos herramientas de primer nivel: **React Hook Form** y **Zod**.

---

## 1. Zod: El Guardia de Seguridad (Esquemas)

Creamos el archivo `src/lib/schemas.js`. Aquí es donde definimos las "reglas estrictas" de lo que aceptamos en la base de datos. Zod es nuestra barrera de contención.

```javascript
import { z } from 'zod';

export const clienteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  telefono: z.string().min(8, 'El teléfono debe ser válido (ej: 11 1234-5678)'),
  email: z.string().email('El correo electrónico no es válido').optional().or(z.literal('')),
  direccion: z.string().optional(),
});
```
**¿Qué significa esto?**
- `nombre`: Obligatorio. Debe ser texto y tener más de 2 letras. Si no, muestra el mensaje de error.
- `email`: Es opcional (`optional`), pero SI escriben algo, tiene que tener formato de email (`.email()`).

---

## 2. React Hook Form: El Gestor del Formulario

En `src/components/ClienteForm.jsx`, usamos `useForm`. Esta herramienta se encarga de recolectar todos los datos sin que la página se ponga lenta (evita re-renderizados innecesarios).

```javascript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(clienteSchema)
});
```

Fíjate en cómo conectamos ambas herramientas: le decimos a `useForm` que use nuestro esquema de Zod (`clienteSchema`) como "resolutor" (`resolver`). Es decir: *"Oye Formulario, antes de enviarte, pregúntale a Zod si todo está bien"*.

---

## 3. Registrando Inputs (`{...register}`)

Para que React Hook Form sepa de qué input estamos hablando, usamos la función `register`:

```jsx
<input
  type="text"
  {...register('nombre')}
  className="border-neutral-300"
/>
```
Con solo poner `{...register('nombre')}`, la librería ya sabe que ese cajoncito de texto corresponde a la propiedad "nombre" de Zod. ¡Es pura magia!

---

## 4. Mostrando los Errores

Si Zod detecta que algo está mal (ej: dejaste el nombre vacío), nos manda el error a través de la variable `errors`.

```jsx
{errors.nombre && <p className="text-red-600">{errors.nombre.message}</p>}
```
Esto se lee así: **Si existe un error en "nombre", entonces dibuja este párrafo en color rojo con el mensaje que Zod definió**. Además, también usamos esta variable para pintar los bordes del `input` de color rojo si hay un error.

### ¡A romper el formulario!
1. Ve a `http://localhost:5173/clientes` y haz clic en el botón rojo **"Nuevo Cliente"**.
2. Intenta guardar el formulario estando vacío. Verás cómo los bordes se ponen rojos y aparecen los mensajes sin recargar la página.
3. Escribe datos válidos y guárdalo, verás que simula un "Guardando..." y te devuelve a la lista de clientes.
