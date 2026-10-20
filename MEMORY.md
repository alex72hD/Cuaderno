# MEMORY.md — Memoria Persistente del Proyecto: Cuaderno con Calculadora

## 1. Contexto y Visión del Proyecto
- **Nombre:** Cuaderno Digital de Pedidos con Calculadora Integrada (Mobile Local-First).
- **Objetivo:** Brindar a comerciantes, distribuidores y usuarios móviles un cuaderno ágil para registrar pedidos por peso o cantidad, gestionar grupos de entrega, tomar notas y hacer cálculos contables en tiempo real con cero latencia y sin requerir internet.
- **Entorno:** Aplicación web móvil PWA / local construida con React + TypeScript + Vite.

---

## 2. Decisiones de Arquitectura Consolidadas (ADRs)

### ADR-001: Arquitectura 100% Local-First y Offline Total
- **Decisión:** La aplicación es autónoma y almacena toda la información directamente en el dispositivo móvil (`localStorage` con fallback seguro).
- **Motivación:** Garantizar privacidad completa, latencia cero y funcionamiento ininterrumpido en cualquier lugar sin depender de señal celular o Wi-Fi.
- **Implicación:** Queda vetada cualquier dependencia obligatoria de APIs en la nube o backend externo.

### ADR-002: Enfoque de Experiencia de Usuario Mobile-First
- **Decisión:** La interfaz está diseñada para dimensiones de smartphone (viewport típico 360px a 430px) con orientación vertical como prioridad.
- **Motivación:** El uso principal es con una o dos manos en dispositivos móviles.
- **Implicación:** Botones táctiles mínimos de 44x44px, interfaces limpias, ligeras y libres de elementos visuales saturados.

### ADR-003: Motor Matemático Seguro y Precisión Decimal
- **Decisión:** Prohibir el uso de `eval()` o constructores dinámicos de funciones para ejecutar operaciones aritméticas. Implementar o adoptar un evaluador de expresiones aritméticas seguro (lexer/parser o algoritmo Shunting-Yard) con control de precisión decimal (evitar anomalías de redondeo de punto flotante).
- **Motivación:** Seguridad y fiabilidad en cálculos de cuentas y dinero.

### ADR-004: Integración Fluida Calculadora -> Notas
- **Decisión:** El resultado de cualquier operación calculada puede inyectarse con un solo toque en la posición del cursor de la nota abierta o agregarse como un nuevo renglón con etiqueta.
- **Motivación:** Evitar el tedioso cambio entre apps de notas y calculadora independiente.

### ADR-005: Integración Unificada de Pedidos Agrupados
- **Decisión:** Los pedidos agrupados e individuales no se mantienen aislados en mundos separados. En la pestaña principal de **Pedidos** se pueden ver todos los pedidos, filtrar por "Sin grupo" o filtrar por lotes específicos.
- **Motivación:** Si un usuario creaba pedidos dentro de un grupo, desaparecían de la vista de pedidos. La unificación permite consultar y editar cualquier pedido, asignarlo o desvincularlo de un grupo en un toque.
- **Implicación:** La hoja de pedido (`OrderSheet`) incluye un selector de grupo directo y refleja el contexto del lote.

### ADR-006: Cero Datos Mockeados (Producción Limpia)
- **Decisión:** Eliminar todas las semillas de datos de prueba (`SEED_PRODUCTS`, `SEED_ORDERS`, `SEED_NOTES`) y descartar automáticamente los registros de prueba antiguos en el almacenamiento local.
- **Motivación:** El usuario debe iniciar con un cuaderno limpio, listo para ingresar sus propios clientes, notas y productos reales sin registros falsos molestos.

### ADR-007: Aligeramiento Visual de la Interfaz
- **Decisión:** Retirar gradientes invasivos, emojis gigantes y banners informativos redundantes (como el banner de instrucciones de pesaje). Optimizar el espacio vertical para que la tabla de productos y el saldo a cobrar tengan máxima visibilidad en pantallas pequeñas.
- **Motivación:** Mejorar la agilidad, evitar la fatiga visual y proyectar una experiencia premium tipo cuaderno de notas moderno.

---

### ADR-008: Interfaz tipo cuaderno y reducción de funciones
- **Decisión:** Un solo tema de papel rayado; navegación inferior de 3 pestañas (Pedidos, Notas, Calcular). Los grupos viven como filtros dentro de Pedidos (se elimina la pestaña Grupos). Notas e índice/hoja sin sub-pestañas.
- **Retirado:** temas oscuro/claro, IVA y descuentos % en la calculadora, categorías de notas, modo dividido, `Header` sin uso, assets de plantilla de Vite, limpieza de mocks antiguos.
- **Corregido:** insertar desde la calculadora ya no se pierde al seguir escribiendo en la nota; el guardado con debounce vive en `localStore`.

---

## 3. Esquemas de Datos Básicos (Contratos de Estado)

### Modelo de Pedido del Cliente (`ClientOrder`)
```typescript
interface ClientOrder {
  id: string;               // Identificador único
  batchId?: string;         // ID del grupo al que pertenece (opcional)
  clientName: string;       // Nombre del cliente o negocio
  clientPhone?: string;     // Teléfono de contacto
  status: 'pendiente' | 'entregado' | 'pagado';
  date: number;             // Timestamp del pedido
  items: OrderItem[];       // Lista de productos pesados/agregados
  discount: number;         // Descuento en dinero
  deposit: number;          // Abono recibido
  notes: string;            // Notas de entrega
  createdAt: number;
  updatedAt: number;
}
```

### Modelo de Grupo de Pedidos (`OrderBatch`)
```typescript
interface OrderBatch {
  id: string;               // Identificador del grupo (ej: "batch-17...")
  name: string;             // Nombre (ej: "Pedido 24")
  createdAt: number;
}
```

### Modelo de Nota (`Note`)
```typescript
interface Note {
  id: string;               // UUID generado localmente
  title: string;            // Título de la nota
  content: string;          // Cuerpo del texto / renglones
  category: string;         // Categoría
  tags: string[];           // Etiquetas para filtrar
  createdAt: number;        // Timestamp local
  updatedAt: number;        // Timestamp local de última edición
  isPinned?: boolean;       // Fijada al inicio de la lista
}
```

---

## 4. Estado Actual del Repositorio
- **Fase:** Fase de refinamiento y unificación de pedidos completada con éxito.
- **Componentes y Módulos Clave:**
  - `src/store/useOrdersStore.ts`: Gestión unificada de pedidos individuales y agrupados, `setOrderBatch`, filtros y totales reactivos.
  - `src/components/OrderSheet.tsx`: Hoja de pedido con selector de grupo, pesaje instantáneo aligerado, desglose claro y compartir por WhatsApp.
  - `src/storage/localStore.ts`: Almacenamiento limpio sin mocks con sanitización automática de datos de prueba antiguos.
  - `src/App.tsx`: Layout móvil táctil con filtros de grupos integrados, barra de tabs simplificada y diseño aligerado.
- **Validación de Calidad:** `npm run build` y `npm run lint` ejecutados con 0 errores.
