# AGENTS.md — Cuaderno con Calculadora Integrada (Móvil Local Offline)

## Descripción del Proyecto
Es un cuaderno digital de notas y cuentas optimizado para dispositivos móviles con pesaje, cálculo en tiempo real y gestión integral de pedidos individuales y agrupados. Diseñado para comerciantes, distribuidores, profesionales y cualquier persona que requiera calcular importes por peso o cantidad, organizar clientes por grupo y transferir cifras a sus notas o a WhatsApp al instante. Su objetivo primordial es ofrecer una experiencia 100% local, privada, táctil, ligera e instantánea, funcionando de forma completamente autónoma sin conexión a internet ni datos mockeados.

---

## Stack y Estructura

### Tecnologías Clave
- **Frontend / Framework:** React 19 (con TypeScript) montado sobre **Vite** para máxima velocidad de compilación y recarga en caliente.
- **Estilos:** **TailwindCSS** configurado con enfoque mobile-first (pantallas de 360px a 430px de ancho base) y paleta visual aligerada.
- **Gestión de Estado:** **Zustand** para estado reactivo, liviano y desacoplado (`useOrdersStore`, `useNotesStore`, `useCalculatorStore`).
- **Almacenamiento Local (100% Offline):** `localStorage` con guardado con debounce y soporte de exportación/importación en JSON.
- **Arquitectura Móvil:** Diseño Web Móvil / PWA con ergonomía táctil y controles optimizados para el uso con pulgares.
- **Iconografía:** **Lucide React** para botones táctiles legibles y minimalistas.
- **Audio y Háptica:** Web Audio API local para feedback de toques sin dependencias externas.

### Estructura de Carpetas
```text
src/
├── components/         # OrdersView, OrderSheet, WeighSheet, NoteList, NoteEditor, Calculator, modales y ui.tsx
├── storage/            # Persistencia en localStorage sin mocks y respaldo JSON
├── store/              # Stores de Zustand (useOrdersStore, useNotesStore, useCalculatorStore)
├── types/              # Definiciones TypeScript (ClientOrder, OrderBatch, Product, Note, Settings)
├── utils/              # Motor aritmético seguro (sin eval), formateadores y sonido local
├── App.tsx             # Cuaderno: 3 pestañas inferiores (Pedidos, Notas, Calcular)
└── main.tsx            # Punto de entrada
```

---

## Comandos Copiables
```bash
# Instalar dependencias del proyecto
npm install

# Iniciar servidor de desarrollo accesible desde el móvil en la misma red Wi-Fi
npm run dev -- --host

# Validar sintaxis y buenas prácticas con Oxlint
npm run lint

# Compilar bundle de producción optimizado para móvil offline
npm run build

# Previsualizar el bundle de producción localmente
npm run preview -- --host
```

---

## Convenciones

- **Idioma:**
  - Código, nombres de variables, funciones y tipos en **inglés** o bilingüe consistente (ej: `useOrdersStore`, `calculateOrderTotals`, `selectedBatchFilter`).
  - Textos de interfaz de usuario, mensajes de ayuda, placeholders y documentación en **español** claro y amigable.
- **Diseño Táctil Móvil (Touch Ergonomics):**
  - Botones y zonas de toque con un tamaño mínimo de **44px x 44px** para uso ergonómico con pulgares.
  - Diseño aligerado: evitar banners redundantes de instrucciones, degradados pesados o elementos que sobrecarguen la pantalla.
  - Feedback visual inmediato (efecto `:active` sutil y respuesta auditiva o háptica local).
- **Estilo de Código:**
  - Componentes funcionales limpios con TypeScript estricto (`noImplicitAny`, interfaces claras para modelos de datos).
  - Stores reactivos con mutaciones inmutables y persistencia inmediata en almacenamiento local.

---

## Reglas de Dominio y Trampas Conocidas

1. **Cero Dependencia de Internet (Regla de Oro):**
   - La aplicación jamás debe intentar realizar peticiones `fetch`/`axios` a endpoints externos.
   - Todo opera localmente en el dispositivo. La app debe arrancar y funcionar al 100% en **Modo Avión**.
2. **Integración Total de Pedidos Agrupados:**
   - Los pedidos que pertenecen a un grupo **no deben aislarse ni excluirse** de la vista principal de pedidos.
   - En la vista de pedidos, el usuario debe poder ver todos los pedidos, filtrar por pedidos individuales ("Sin grupo") o filtrar por un grupo específico.
   - Cualquier pedido puede asignarse, reasignarse o desvincularse de un grupo directamente desde su hoja (`OrderSheet`).
3. **Cero Datos Mockeados (Clean Slate):**
   - No inyectar listas de pedidos, productos o notas falsas por defecto. La aplicación debe comenzar limpia y vacía, lista para que el usuario guarde sus datos reales.
4. **Diseño Aligerado y Aprovechamiento Vertical:**
   - En pantallas móviles estrechas (360px-430px), cada píxel vertical cuenta. Se deben evitar banners de texto redundantes o cajas decorativas voluminosas.
5. **Precisión Matemática y Contabilidad Decimal:**
   - Evitar errores clásicos de coma flotante de JavaScript (ej. `0.1 + 0.2 !== 0.3`).
   - Usar lógica de redondeo seguro contable a 2 decimales para operaciones de dinero y peso.
6. **Punto vs. Coma Decimal:**
   - Aceptar tanto `,` como `.` como separadores decimales válidos en teclado numérico y campos de entrada.
7. **Evaluación de Expresiones Segura:**
   - **PROHIBIDO TERMINANTEMENTE EL USO DE `eval()` o `new Function()`** para resolver cálculos. Se debe usar el motor evaluador seguro implementado en `src/utils/mathEngine.ts`.
8. **Auto-guardado con Debounce:**
   - Guardar cambios en notas y pedidos en `localStorage` con debounce de 300-400ms para prevenir pérdidas en caso de bloqueo de pantalla o cambio de aplicación en el móvil.

---

## Límites

- ✅ **Siempre:**
  - Garantizar que la app opere perfectamente desconectada de internet.
  - Mantener los pedidos agrupados accesibles e integrados en la vista de pedidos.
  - Proteger los datos reales del usuario asegurando persistencia local inmediata.
  - Mantener la interfaz limpia, ágil y aligerada.
- ⚠️ **Pregunta antes de:**
  - Introducir dependencias npm nuevas.
  - Alterar drásticamente el esquema de almacenamiento de pedidos o notas.
- 🚫 **Nunca:**
  - Añadir llamadas a APIs remotas, analíticas invasivas o autenticación requerida.
  - Usar `eval()` para resolver cálculos matemáticos.
  - Reintroducir datos de prueba mockeados que ensucien la experiencia de usuario.

---

## Verificación

Antes de dar por completada cualquier tarea:
1. **Compilación y Linters:** Ejecutar `npm run build` sin errores de compilación ni TypeScript.
2. **Verificación Mobile Viewport:** Probar visualmente en dimensiones móviles estándar (360px a 430px).
3. **Verificación Offline:** Confirmar funcionamiento completo desconectado.
4. **Verificación de Persistencia y Cero Mocks:** Crear un pedido, recargar la página y constatar que persiste sin reaparición de datos de prueba.