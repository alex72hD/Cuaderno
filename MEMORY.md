# MEMORY.md — Memoria Persistente del Proyecto: Cuaderno con Calculadora

## 1. Contexto y Visión del Proyecto
- **Nombre:** Cuaderno con Calculadora Integrada (Mobile Local-First).
- **Objetivo:** Brindar a usuarios móviles un cuaderno ágil para notas, presupuestos y cálculos diarios, integrando una calculadora interactiva que alimenta directamente el texto de las notas sin requerir conexión a internet.
- **Entorno:** Aplicación local en móvil construida con React + TypeScript + Vite.

---

## 2. Decisiones de Arquitectura Consolidadas (ADRs)

### ADR-001: Arquitectura 100% Local-First y Offline Total
- **Decisión:** La aplicación es autónoma y almacena toda la información directamente en el dispositivo móvil (IndexedDB / localStorage).
- **Motivación:** Garantizar privacidad completa, latencia cero y funcionamiento ininterrumpido en cualquier lugar sin depender de señal celular o Wi-Fi.
- **Implicación:** Queda vetada cualquier dependencia obligatoria de APIs en la nube o backend externo.

### ADR-002: Enfoque de Experiencia de Usuario Mobile-First
- **Decisión:** La interfaz está diseñada para dimensiones de smartphone (viewport típico 360px a 430px) con orientación vertical como prioridad.
- **Motivación:** El uso principal es con una o dos manos en dispositivos móviles.
- **Implicación:** Los botones de la calculadora y accesos rápidos del cuaderno deben tener un tamaño táctil mínimo de 44x44px, con layouts adaptables (pantalla dividida, drawer inferior o modo teclado numérico acoplado).

### ADR-003: Motor Matemático Seguro y Precisión Decimal
- **Decisión:** Prohibir el uso de `eval()` o constructores dinámicos de funciones para ejecutar operaciones aritméticas. Implementar o adoptar un evaluador de expresiones aritméticas seguro (lexer/parser o algoritmo Shunting-Yard) con control de precisión decimal (evitar anomalías de redondeo de punto flotante).
- **Motivación:** Seguridad y fiabilidad en cálculos de cuentas y dinero.

### ADR-004: Integración Fluida Calculadora -> Notas
- **Decisión:** El resultado de cualquier operación calculada puede inyectarse con un solo toque en la posición del cursor de la nota abierta o agregarse como un nuevo renglón con etiqueta.
- **Motivación:** Evitar el tedioso cambio entre apps de notas y calculadora independiente.

---

## 3. Esquemas de Datos Básicos (Contratos de Estado)

### Modelo de Nota (`Note`)
```typescript
interface Note {
  id: string;               // UUID generado localmente
  title: string;            // Título de la nota
  content: string;          // Cuerpo del texto / renglones
  tags?: string[];          // Etiquetas para filtrar (ej. 'Gastos', 'Trabajo')
  createdAt: number;        // Timestamp local
  updatedAt: number;        // Timestamp local de última edición
  isPinned?: boolean;       // Fijada al inicio de la lista
}
```

### Modelo de Cálculo (`CalculationItem`)
```typescript
interface CalculationItem {
  id: string;
  expression: string;       // Ej: "15000 + 3200 * 2"
  result: number | string;  // Ej: 21400
  timestamp: number;
  noteId?: string;          // ID de la nota vinculada (opcional)
}
```

---

## 4. Estado Actual del Repositorio
- **Fase:** Implementación base MVP completada y validada.
- **Servidor Local Activo:** Vite corriendo con soporte `--host` en `http://localhost:5173`.
- **Componentes y Módulos Desarrollados:**
  - `src/utils/mathEngine.ts`: Evaluador matemático seguro Shunting-Yard (sin `eval`), detector de cifras en texto y redondeo contable.
  - `src/utils/sound.ts`: Sintetizador Web Audio API para feedback háptico/táctil 100% offline.
  - `src/storage/localStore.ts`: Persistencia en `localStorage` con semillas iniciales y exportación/importación en JSON.
  - `src/store/useNotesStore.ts` y `src/store/useCalculatorStore.ts`: Gestión de estado con Zustand.
  - `src/components/`: `Header`, `Calculator`, `NoteEditor`, `NoteList`, `CalcHistoryModal`, `BackupModal`.
  - `src/App.tsx`: Layout móvil táctil con modos `split`, `notes`, `calculator` y drawer deslizante.
- **Validación de Calidad:** `npm run build` ejecutado exitosamente con 0 errores TypeScript.

---

## 5. Próximos Pasos (Roadmap Evolutivo)
1. Probar en dispositivo físico móvil mediante la IP de red local (`npm run dev -- --host`).
2. Evaluar mejoras adicionales (exportación de notas a PDF o TXT plano local, categorización por carpetas o colores personalizados).
3. Configuración opcional con Capacitor si se desea generar APK de Android o IPA de iOS nativo.
