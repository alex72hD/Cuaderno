# CONSTITUTION.MD — Principios Supremos del Proyecto

Este documento establece las leyes y principios arquitectónicos inmutables del **Cuaderno Digital de Pedidos con Calculadora Integrada (Móvil Local Offline)**. Cualquier cambio que viole estos artículos se considera inválido.

---

## Preámbulo
El propósito supremo de este software es ser el cuaderno digital del comerciante, tendero, carnicero o proveedor que necesita:
1. Registrar **pedidos por cliente** anotando el peso de cada producto.
2. Ver el **subtotal calculado en tiempo real** al poner el peso, sin hacer operaciones mentales.
3. Tener todo el cuaderno de cuentas en el **celular**, funcionando sin internet.
4. Organizar clientes en grupos de entrega sin perder la visibilidad unificada de los pedidos.

---

## Artículos Fundamentales

### Artículo I: El Cuaderno Manda (Notebook-First)
1. La pantalla principal es siempre el **cuaderno de pedidos por cliente**, no la calculadora.
2. La calculadora es una herramienta integrada al cuaderno, no una app independiente.
3. El flujo principal es: **seleccionar producto → digitar peso → suma inmediata al pedido**.

### Artículo II: Cálculo Instantáneo al Digitar el Peso
1. En el momento que el usuario digita el peso (ej: `1.45`), el subtotal `precio × peso` debe actualizarse **en tiempo real en pantalla**, sin esperar a que presione ningún botón de confirmar.
2. El total del pedido del cliente se recalcula automáticamente cada vez que se agrega, edita o elimina un producto.
3. Nunca mostrar resultados desactualizados o inconsistentes.

### Artículo III: Flujo de Pedido por Cliente
1. Cada **cliente tiene su propia hoja/página** en el cuaderno con su nombre, teléfono, grupo asignado y estado del pedido.
2. Dentro de la hoja de pedido se pueden agregar N productos (con peso y precio por kg o por unidad).
3. El cuaderno muestra: items pesados, subtotales por producto, descuento, abono recibido y **saldo a cobrar** siempre visible al pie de la página.
4. El pedido puede compartirse como texto formateado para WhatsApp con un solo toque.

### Artículo IV: Integración Completa de Pedidos Agrupados
1. Los pedidos que pertenecen a un grupo (lote de entrega) **jamás deben quedar ocultos o ignorados** en la vista principal de pedidos.
2. La vista de pedidos debe permitir consultar todos los pedidos, filtrar por pedidos individuales o filtrar por cada grupo específico.
3. El comerciante puede asignar, reasignar o desvincular un cliente de un grupo directamente desde su hoja de pedido.

### Artículo V: Cero Datos Falsos e Interfaz Aligerada (Clean Slate)
1. La aplicación **no debe contener datos mockeados ni pedidos ficticios** por defecto. El usuario inicia siempre con un cuaderno limpio.
2. La interfaz debe ser ligera, sobria y rápida; se prohíben banners gigantes de instrucciones redundantes que roben espacio vertical en pantalla móvil.

### Artículo VI: Lista de Precios Local
1. El comerciante registra sus productos con nombre, precio y unidad (kg, lb, unidad, paquete) en una lista local.
2. Al agregar un producto a un pedido, el precio se carga automáticamente desde la lista.
3. El precio de un producto puede actualizarse en la lista en cualquier momento; esto NO modifica pedidos anteriores guardados.

### Artículo VII: Soberanía Local y Desconexión Total (Offline-First)
1. **Cero internet requerido.** La app funciona completamente en Modo Avión.
2. Todo se guarda en `localStorage` del dispositivo: pedidos, grupos, productos, notas y configuraciones.
3. Queda vetada cualquier llamada `fetch` o dependencia de backend remoto en runtime.

### Artículo VIII: Ergonomía Móvil (Touch-First)
1. Diseño para pantallas de 360px a 430px, uso ergonómico con pulgares.
2. Botones táctiles mínimo 44×44px, especialmente el teclado numérico de peso.
3. Feedback inmediato al tocar: animación `:active`, sonido suave (Web Audio API local), vibración si el navegador lo soporta.

### Artículo IX: Integridad Aritmética
1. `eval()` y `new Function()` están **terminantemente prohibidos** para cálculos.
2. Redondeo seguro para evitar errores de punto flotante (ej: `0.1 + 0.2`).
3. Aceptar tanto punto `.` como coma `,` como separador decimal.

### Artículo X: Privacidad y Respaldo Autónomo
1. Los datos del comerciante (clientes, precios, pedidos) nunca salen del dispositivo.
2. No hay analytics, cookies de terceros ni telemetría.
3. Se puede exportar todo el cuaderno a un archivo JSON para respaldo offline y transferirlo libremente.

---

## Puertas de Calidad (Quality Gates)

Antes de dar por terminada cualquier tarea:
1. **`npm run build`** debe pasar sin errores ni warnings críticos de TypeScript.
2. **Verificación Offline:** desactivar red → la app carga y funciona al 100%.
3. **Verificación de Pesaje en Vivo:** poner peso → subtotal se actualiza al instante.
4. **Verificación de Pedidos Agrupados:** un pedido creado en un grupo debe ser visible y editable en la vista de pedidos.
5. **Verificación de Persistencia y Cero Mocks:** agregar pedido → recargar página → los datos se conservan sin resucitar datos de prueba.
6. **Verificación Móvil (360px):** sin scroll horizontal no deseado y con botones táctiles cómodos.
