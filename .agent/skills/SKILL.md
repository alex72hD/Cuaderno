---
name: mobile-cuaderno-calculadora
description: Procedimientos y flujos de trabajo especializados para desarrollar, auditar y mantener el Cuaderno con Calculadora Integrada en React móvil local (100% offline).
---

# Flujo de Trabajo Especializado: Cuaderno con Calculadora Móvil Offline

Esta habilidad proporciona los procedimientos operativos estándar para implementar funcionalidades, refactorizaciones y correcciones en la aplicación móvil local de Cuaderno con Calculadora Integrada.

---

## 1. Protocolo de Desarrollo de Interfaz Móvil Táctil (Mobile-First)

Al diseñar o modificar componentes visuales en React y TailwindCSS:

1. **Restricción de Ancho y Layout:**
   - Diseñar primariamente para pantallas de **360px a 430px** de ancho.
   - Usar contenedores con `max-w-md mx-auto w-full min-h-screen` y layout flexbox/grid adaptable.
   - Prevenir desbordamiento horizontal (`overflow-x-hidden`).
2. **Dimensiones de Botones e Interacción:**
   - Todos los botones de la calculadora y barras de acciones deben tener al menos `h-11` a `h-14` (44px a 56px) y `w-full` o un tamaño mínimo de `44px x 44px`.
   - Utilizar estados activos táctiles claros: `active:scale-95 transition-transform active:bg-neutral-200 dark:active:bg-neutral-700`.
3. **Distribución de Pantalla Dividida o Desplegable (Split / Drawer):**
   - **Modo Dividido (Split Screen):** Mitad superior: Editor/Lista de notas; Mitad inferior: Teclado de calculadora con pantalla de expresión.
   - **Modo Drawer / Bottom Sheet:** La calculadora se desliza desde la parte inferior como un panel táctil sin tapar la nota activa.
   - **Modo Teclado:** La calculadora actúa como un teclado numérico extendido que inserta resultados directamente en la línea de texto.

---

## 2. Protocolo del Motor Matemático de la Calculadora

Para mantener la seguridad, precisión y evitar fallos:

1. **Evaluación Segura de Expresiones (Prohibido `eval`):**
   - Implementar un evaluador basado en tokens o el algoritmo *Shunting-Yard* para procesar operadores: `+`, `-`, `*`, `/`, `%`, paréntesis y potencias básicas.
   - Normalizar la expresión antes de evaluarla:
     ```typescript
     // Reemplazar coma por punto decimal y signos visuales
     const sanitized = expression
       .replace(/,/g, '.')
       .replace(/×/g, '*')
       .replace(/÷/g, '/');
     ```
2. **Control de Precisión Decimal (Finanzas y Cuentas):**
   - Almacenar resultados numéricos normalizados y formatear para visualización:
     ```typescript
     export function formatResult(value: number, maxDecimals: number = 4): string {
       if (isNaN(value)) return 'Error';
       // Redondeo para evitar 0.30000000000000004
       const factor = Math.pow(10, maxDecimals);
       const rounded = Math.round(value * factor) / factor;
       return rounded.toLocaleString('es-CO', { maximumFractionDigits: maxDecimals });
     }
     ```
3. **Manejo de Errores de División por Cero y Sintaxis:**
   - Capturar excepciones y devolver un estado de `Error` limpio en pantalla en lugar de provocar un cuelgue en la aplicación.

---

## 3. Protocolo de Persistencia Local-First (100% Offline)

Toda la persistencia ocurre en el dispositivo:

1. **Abstracción del Repositorio Local:**
   - Encapsular el acceso a datos en un módulo `storage` (usando IndexedDB o fallback a `localStorage` con serialización JSON segura).
2. **Auto-Guardado con Debounce:**
   - Al tipear en el editor de notas, activar un timer de debounce (300-500ms):
     ```typescript
     useEffect(() => {
       const timer = setTimeout(() => {
         saveNoteLocally(currentNote);
       }, 400);
       return () => clearTimeout(timer);
     }, [currentNote.content, currentNote.title]);
     ```
3. **Cero Peticiones de Red:**
   - No añadir llamadas `fetch` a servicios web externos. Los datos nunca salen del dispositivo del usuario.

---

## 4. Protocolo de Sinergia entre Calculadora y Notas

La interacción entre el cálculo y el texto debe ser fluida:

1. **Inserción en el Cursor:**
   - Detectar la posición actual del cursor (`selectionStart` y `selectionEnd`) en el `textarea` o input de la nota.
   - Al presionar el botón *"Insertar en Nota"*, inyectar el valor o la expresión formateada (ej. `[15,000 + 3,500 = 18,500]`) en la posición exacta del cursor y reposicionarlo después de la inserción.
2. **Cálculo de Totales de Renglón:**
   - Permitir al usuario seleccionar números o líneas de la nota y enviarlos a la calculadora para sumar subtotales rápidamente.
3. **Historial de Cálculos:**
   - Registrar las últimas operaciones realizadas en un panel deslizable para que el usuario pueda recuperar cualquier cálculo previo e insertarlo en cualquier momento.

---

## 5. Checklist de Verificación antes de Concluir Cambios

- [ ] **Validación TypeScript:** Sin errores de compilación ni tipos `any` inseguros.
- [ ] **Viewport Móvil:** Comprobar en emulador o navegador móvil que la interfaz se ajusta perfectamente a 360px de ancho sin scroll lateral.
- [ ] **Test Offline:** Desactivar la conexión de red (Network: Offline en DevTools) y verificar que la app carga, crea notas, calcula y guarda sin inconvenientes.
- [ ] **Prueba de Persistencia:** Guardar una nota y un cálculo, recargar el navegador y corroborar que la información se mantiene intacta.
- [ ] **Usabilidad Táctil:** Los botones tienen buen espacio, son fáciles de pulsar y responden inmediatamente.
