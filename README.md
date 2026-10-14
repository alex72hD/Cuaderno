# Cuaderno de Pedidos

Aplicación móvil local para organizar pedidos por cliente, administrar productos y precios, tomar notas y hacer cálculos contables en tiempo real. Todos los datos se guardan localmente en el dispositivo sin requerir cuenta, internet ni servidores externos.

## Funciones Principales

- **Gestión Integral de Pedidos y Grupos:**
  - Los pedidos agrupados e individuales están completamente integrados: en la pestaña **Pedidos** puedes ver todos tus pedidos, filtrar por "Sin grupo" o filtrar por grupos específicos (ej. “Pedido 24”).
  - Puedes crear nuevos grupos y asignar o reasignar cualquier pedido a un grupo directamente desde la hoja de pedido.
  - La pestaña **Grupos** te permite consultar el balance total del grupo, cuántos clientes han pagado y administrar el ciclo de entrega.
- **Pesaje y Cálculo en Tiempo Real:** registra productos calculando de inmediato `precio × peso o cantidad`. Soporta descuentos, abonos y muestra el saldo a cobrar actualizado al instante.
- **Compartir por WhatsApp:** copia el resumen formateado del recibo/pedido con un solo toque, incluyendo el grupo de entrega si aplica.
- **Sin datos ficticios (cero mocks):** la app arranca 100% limpia y lista para uso real, sin datos mockeados ni notas de prueba prefabricadas.
- **Diseño aligerado y ergonómico:** interfaz táctil optimizada para teléfonos móviles (360px a 430px), libre de elementos visuales saturados, con cabecera compacta y controles accesibles para el pulgar.
- **Catálogo de Precios Local:** administra productos con precio base por kg, lb, gramo, unidad o paquete.
- **Notas Rápidas:** crea y organiza apuntes con detección inteligente de sumas contables y calculadora rápida acoplada.
- **Calculadora Segura:** motor aritmético exacto (sin `eval`), con historial de operaciones y precisión decimal.
- **Respaldo Local Offline:** exporta e importa copias de seguridad en formato JSON cuando desees.

## Requisitos

- Node.js (versión 18 o superior) y npm.
- Un navegador web moderno (Chrome, Safari, Firefox, Edge).

## Instalación y Desarrollo

Para ejecutar localmente:

```bash
npm install
npm run dev
```

Para abrir la app directamente desde el teléfono móvil conectado a la misma red Wi-Fi:

```bash
npm run dev -- --host
```

Abre en el navegador del móvil la dirección IP local indicada en la terminal.

## Comandos Disponibles

```bash
npm run lint     # Comprueba el código con Oxlint
npm run build    # Verifica TypeScript y compila el bundle optimizado para producción
npm run preview  # Previsualiza la compilación de producción localmente
```

## Arquitectura y Tecnologías

- **React 19** con **TypeScript** estricto.
- **Vite** para compilación ultrarrápida.
- **Tailwind CSS** con enfoque mobile-first y paleta aligerada.
- **Zustand** para la gestión de estado reactivo y desacoplado.
- **Lucide React** para iconografía táctil.
- **localStorage** para almacenamiento 100% autónomo y persistente en el dispositivo.

## Estructura del Código

```text
src/
├── components/   # Vistas de pedidos (OrderSheet), catálogo, notas y calculadora
├── storage/      # Persistencia en localStorage (cero mocks) y respaldo JSON
├── store/        # Stores de Zustand (useOrdersStore, useNotesStore, useCalculatorStore)
├── types/        # Definiciones de tipos (ClientOrder, OrderBatch, Product, Note)
└── utils/        # Motor aritmético seguro, formateadores y sintetizador de audio háptico
```

## Privacidad y Filosofía Offline

La aplicación opera bajo el principio **Local-First**: tus datos, clientes, precios y notas jamás salen de tu teléfono. Funciona en Modo Avión sin conexión de datos.
