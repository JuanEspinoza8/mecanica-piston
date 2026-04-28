# 👨‍🏫 Clase 11: Formularios Dinámicos Dependientes (ISSUE-14)

El formulario de creación de Órdenes de Trabajo tiene un desafío particular que lo diferencia del Formulario de Clientes: **Sus campos dependen entre sí.**

No podemos dejar que el mecánico escriba a mano el nombre del auto, porque eso llevaría a errores (como escribir "Ford Fiesta" o "fiesta ford"). En lugar de eso, usamos listas desplegables (combobox/select).

---

## 1. El Comportamiento "Cascada"

El desafío lógico es el siguiente: 
1. El mecánico debe seleccionar primero a qué **Cliente** le está haciendo la orden.
2. Recién cuando selecciona un cliente, el segundo cajón (el de **Vehículos**) debe habilitarse y mostrar *únicamente* los autos que le pertenecen a ese cliente.

Para lograr esto con `react-hook-form`, usamos la función secreta `watch`:

```javascript
// 1. "Observamos" en vivo qué cliente seleccionó el usuario en el primer cajón
const clienteIdSeleccionado = watch('clienteId');

// 2. Buscamos ese cliente en nuestra base de datos falsa
const clienteActual = clientesMock.find(c => c.id === clienteIdSeleccionado);

// 3. Extraemos solo los autos de ese cliente (si es que existe)
const vehiculosDisponibles = clienteActual ? clienteActual.vehiculos : [];
```

---

## 2. Bloqueo de Seguridad en la UI

Si el mecánico aún no ha elegido a un cliente, no tendría sentido dejar que abra el menú de autos (porque estaría vacío). Para evitar confusiones, lo bloqueamos visualmente:

```jsx
<select
  disabled={!clienteIdSeleccionado}
  className={!clienteIdSeleccionado ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-white'}
>
  <option value="">
    {!clienteIdSeleccionado ? 'Primero seleccione un cliente' : 'Seleccione un vehículo...'}
  </option>
</select>
```
**¿Qué ocurre aquí?**
- `disabled`: Si la variable `clienteIdSeleccionado` está vacía, el cajón se desactiva.
- `cursor-not-allowed`: Cambiamos el puntero del mouse a un círculo rojo bloqueado para darle una pista visual de que no puede hacer clic ahí todavía.
- Cambiamos dinámicamente el texto inicial para guiarlo: "Primero seleccione un cliente".

---

## 3. Área de Texto Libre (Textarea)

Para el campo del "Síntoma o Motivo de Ingreso", un simple `input` de una línea no alcanzaría, ya que a veces los clientes dan explicaciones muy largas de los ruidos de su auto. 
Por eso usamos un `<textarea rows={4}>`. Y para evitar que el usuario deforme toda la página web arrastrando la esquina de la caja de texto (un comportamiento clásico de los navegadores), le pusimos la clase de Tailwind `resize-none`.

### ¡Inténtalo tú mismo!
1. Navega a `http://localhost:5173/ordenes`.
2. Toca el botón rojo **"Nueva Orden"**.
3. Observa cómo el cajón de "Vehículo" está bloqueado y gris.
4. Elige a "Juan Pérez" en el primer cajón, y mágicamente el cajón de vehículos se pintará de blanco y te dejará seleccionar su Ford Fiesta.
