# AGENTS.md — Cuaderno con Calculadora Integrada (Móvil Local Offline)

## Descripción del Proyecto
Es un cuaderno de notas y cuentas optimizado para dispositivos móviles con una calculadora integrada en tiempo real. Está diseñado para comerciantes, estudiantes, profesionales y cualquier persona que gestione notas de gastos, presupuestos o listas con cálculos y requiera una herramienta ágil que permita calcular y transferir resultados a las notas al instante. Su objetivo principal es ofrecer una experiencia 100% local, privada, táctil e instantánea, funcionando de manera completamente autónoma sin necesidad de conexión a internet.

---

## Stack y Estructura

### Tecnologías Clave
- **Frontend / Framework:** React (con TypeScript) montado sobre **Vite** para máxima velocidad de compilación y recarga en caliente.
- **Estilos:** **TailwindCSS** configurado con enfoque mobile-first (pantallas de 360px a 430px de ancho base).
- **Gestión de Estado:** **Zustand** para estado global reactivo, liviano y con soporte de middleware para persistencia.
- **Almacenamiento Local (100% Offline):** **IndexedDB** (o `localStorage` como fallback seguro), asegurando que todas las notas, configuraciones e historial de cálculos permanezcan en el almacenamiento local del dispositivo.
- **Arquitectura Móvil:** Diseño Web Móvil / PWA (Progressive Web App con Service Worker y Web App Manifest) para instalación directa en el teléfono sin necesidad de tienda ni backend.
- **Iconografía:** **Lucide React** o **React Icons** para botones táctiles legibles y minimalistas.
- **Fechas y Utilidades:** `date-fns` o helpers nativos en JavaScript para formateo local de fecha/hora.

### Estructura de Carpetas Sugerida
```text
src/
├── assets/             # Íconos, manifest, splash y recursos visuales locales
├── components/         # Componentes UI comunes (Modal, Button, Input, Drawer, Header móvil)
├── features/
│   ├── calculator/     # Teclado táctil, pantalla de cálculo, historial e intérprete matemático
│   ├── notes/          # Editor de notas, lista de cuadernos, tarjetas de notas, tags
│   └── integration/    # Enlace entre calculadora y nota (insertar resultado, calcular líneas)
├── storage/            # Capa de abstracción para IndexedDB/localStorage (CRUD local)
├── store/              # Stores de Zustand (useNotesStore, useCalculatorStore, useAppStore)
├── types/              # Definiciones TypeScript (Note, Calculation, Category, Settings)
├── utils/
│   ├── math/           # Motor de evaluación matemática segura (sin eval) y precisión decimal
│   └── formatters/     # Formateo de moneda, separadores decimales y fechas
├── App.tsx             # Layout móvil principal (Tabs, Split-view o Drawer)
└── main.tsx            # Punto de entrada y registro de Service Worker offline
```

---

## Comandos Copiables
```bash
# Instalar dependencias del proyecto
npm install

# Iniciar servidor de desarrollo accesible desde el móvil en la misma red Wi-Fi
npm run dev -- --host

# Validar tipado y sintaxis (TypeScript + Linter)
npm run lint

# Compilar bundle de producción optimizado para móvil offline
npm run build

# Previsualizar el bundle de producción localmente
npm run preview -- --host
```

---

## Convenciones

- **Idioma:**
  - Código, nombres de variables, funciones y tipos en **inglés** o bilingüe consistente (ej: `useNotesStore`, `calculateExpression`, `activeNoteId`).
  - Textos de interfaz de usuario, mensajes de ayuda, placeholders y documentación en **español** claro y amigable.
- **Diseño Táctil Móvil (Touch Ergonomics):**
  - Botones y zonas de toque con un tamaño mínimo de **44px x 44px** (óptimo 48px) para uso ergonómico con pulgares.
  - Evitar gestos que colisionen con los gestos del sistema operativo móvil (swipe back, scroll pull-to-refresh accidental).
  - Feedback visual inmediato (efecto `:active` / `:hover` sutil y respuesta háptica si el navegador móvil lo soporta).
- **Estilo de Código:**
  - Componentes funcionales pequeños con TypeScript estricto (`noImplicitAny`, interfaces claras para modelos de datos).
  - Hooks personalizados para encapsular lógica de cálculo y persistencia (`useCalculator`, `useNoteEditor`).

---

## Reglas de Dominio y Trampas Conocidas

1. **Cero Dependencia de Internet (Regla de Oro):**
   - La aplicación jamás debe intentar realizar peticiones `fetch`/`axios` a endpoints externos que bloqueen o condicionen la funcionalidad.
   - Fuentes, íconos y librerías deben estar empaquetados localmente en el bundle. La app debe arrancar y funcionar al 100% en **Modo Avión**.
2. **Precisión Matemática y Contabilidad Decimal:**
   - Evitar errores clásicos de coma flotante de JavaScript (ej. `0.1 + 0.2 !== 0.3`).
   - Usar lógica de redondeo seguro o precisión fija de 2 a 4 decimales para operaciones contables/financieras cotidianas.
3. **Punto vs. Coma Decimal:**
   - En teclados móviles hispanohablantes los usuarios usan tanto `,` como `.`. El motor debe normalizar la entrada para evitar fallos de sintaxis al calcular.
4. **Evaluación de Expresiones Segura:**
   - **PROHIBIDO TERMINANTEMENTE EL USO DE `eval()` o `new Function()`** para resolver cálculos. Se debe usar un parser/lexer de tokens matemáticos seguro y controlado.
5. **Simbiosis Calculadora <-> Nota:**
   - El usuario debe poder:
     - Insertar el resultado de la calculadora directamente en la posición del cursor de la nota activa.
     - Seleccionar un valor o número dentro de una nota y cargarlo en la calculadora.
     - Ver un historial de operaciones recientes vinculado a la sesión actual.
6. **Auto-guardado con Debounce:**
   - En móviles el usuario puede cambiar de app o bloquear la pantalla en cualquier momento. Cada pulsación en las notas debe guardarse con un debounce de 300-500ms en el almacenamiento local para prevenir pérdidas.

---

## Forma de Trabajar con Agentes

1. **Planificar antes de codificar:** Antes de implementar una funcionalidad compleja, detallar la arquitectura del componente y el flujo de datos.
2. **Cambios atómicos y seguros:** Modificar piezas concretas sin refactorizar todo el proyecto en una sola pasada.
3. **Explicación al terminar:** Resumir los cambios técnicos hechos, cómo probarlos en un emulador o móvil y qué precauciones considerar.

---

## Límites

- ✅ **Siempre:**
  - Garantizar que la app opere perfectamente desconectada de internet.
  - Diseñar con mentalidad móvil primero (pantallas estrechas, orientación vertical, interacción táctil).
  - Proteger los datos del usuario asegurando persistencia local inmediata.
- ⚠️ **Pregunta antes de:**
  - Introducir librerías o dependencias npm nuevas.
  - Modificar el esquema de datos de las notas o la estructura de almacenamiento.
  - Reestructurar de forma drástica el diseño o navegación entre la vista de notas y la calculadora.
- 🚫 **Nunca:**
  - Añadir llamadas a APIs remotas, analíticas invasivas o autenticación en la nube requerida.
  - Usar `eval()` para resolver cálculos matemáticos.
  - Implementar funciones que bloqueen el hilo principal o provoquen pérdida de notas al recargar la página.

---

## Verificación

Antes de dar por completada cualquier tarea, el agente debe verificar:
1. **Compilación y Linters:** Ejecutar `npm run build` o `npm run lint` sin advertencias críticas ni errores de TypeScript.
2. **Verificación Mobile Viewport:** Probar visualmente en dimensiones móviles estándar (360x780, 390x844, 412x915).
3. **Verificación Offline:** Confirmar que no hay dependencias de red en tiempo de ejecución.
4. **Verificación de Persistencia:** Almacenar una nota, recargar el navegador y corroborar que los datos y el historial de cálculo siguen intactos.