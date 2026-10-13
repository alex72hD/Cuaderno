import type {
  Note,
  CalculationHistoryItem,
  AppSettings,
  Product,
  ClientOrder,
} from '../types';

const PRODUCTS_KEY = 'cuaderno_calc_products_v1';
const ORDERS_KEY = 'cuaderno_calc_orders_v1';
const NOTES_KEY = 'cuaderno_calc_notes_v1';
const HISTORY_KEY = 'cuaderno_calc_history_v1';
const SETTINGS_KEY = 'cuaderno_calc_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'paper',
  hapticSound: true,
  decimalPlaces: 2,
  taxRate: 19,
  currencySymbol: '$',
  defaultUnit: 'kg',
  insertFormat: 'expr_and_result',
};

// Productos semilla con precio por peso o unidad
const SEED_PRODUCTS: Product[] = [
  { id: 'prod-1', name: 'Queso Campesino', price: 18000, unit: 'kg', category: 'Lácteos' },
  { id: 'prod-2', name: 'Carne de Res (Asar)', price: 26000, unit: 'kg', category: 'Carnes' },
  { id: 'prod-3', name: 'Pechuga de Pollo', price: 16500, unit: 'kg', category: 'Carnes' },
  { id: 'prod-4', name: 'Chuleta de Cerdo', price: 19500, unit: 'kg', category: 'Carnes' },
  { id: 'prod-5', name: 'Café Especial 500g', price: 15000, unit: 'unidad', category: 'Abarrotes' },
  { id: 'prod-6', name: 'Huevos AA x 30', price: 18000, unit: 'paquete', category: 'Abarrotes' },
  { id: 'prod-7', name: 'Papa Criolla Limpia', price: 4500, unit: 'kg', category: 'Verduras' },
  { id: 'prod-8', name: 'Tomate Chonto', price: 3800, unit: 'kg', category: 'Verduras' },
];

// Pedidos semilla en el cuaderno
const SEED_ORDERS: ClientOrder[] = [
  {
    id: 'order-1',
    clientName: 'Don Pedro - Restaurante La Casona',
    clientPhone: '310 123 4567',
    status: 'pendiente',
    date: Date.now() - 3600000 * 2,
    items: [
      {
        id: 'item-1-1',
        productId: 'prod-2',
        productName: 'Carne de Res (Asar)',
        pricePerUnit: 26000,
        weightOrQty: 3.25,
        unit: 'kg',
        subtotal: 84500, // 3.25 * 26000
        notes: 'Corte fino',
      },
      {
        id: 'item-1-2',
        productId: 'prod-3',
        productName: 'Pechuga de Pollo',
        pricePerUnit: 16500,
        weightOrQty: 2.1,
        unit: 'kg',
        subtotal: 34650, // 2.1 * 16500
      },
      {
        id: 'item-1-3',
        productId: 'prod-1',
        productName: 'Queso Campesino',
        pricePerUnit: 18000,
        weightOrQty: 1.5,
        unit: 'kg',
        subtotal: 27000, // 1.5 * 18000
      },
    ],
    discount: 5000,
    deposit: 50000,
    notes: 'Entregar antes de las 11:30 AM en la puerta de servicio.',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'order-2',
    clientName: 'Doña Carmen - Tienda La Esquina',
    clientPhone: '320 987 6543',
    status: 'pendiente',
    date: Date.now() - 3600000,
    items: [
      {
        id: 'item-2-1',
        productId: 'prod-1',
        productName: 'Queso Campesino',
        pricePerUnit: 18000,
        weightOrQty: 2.45,
        unit: 'kg',
        subtotal: 44100, // 2.45 * 18000
      },
      {
        id: 'item-2-2',
        productId: 'prod-6',
        productName: 'Huevos AA x 30',
        pricePerUnit: 18000,
        weightOrQty: 2,
        unit: 'paquete',
        subtotal: 36000,
      },
    ],
    discount: 0,
    deposit: 0,
    notes: 'Cobrar contra entrega en efectivo.',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000,
  },
];

const SEED_NOTES: Note[] = [
  {
    id: 'seed-note-1',
    title: 'Apuntes del Día y Cobros Pendientes',
    content: `Ruta de entrega matutina:
• Pasar por donde Don Pedro a las 10:30 AM
• Dejar queso a Doña Carmen
• Cobro pendiente semana pasada: $ 45.000 (Tienda Central)`,
    category: 'Cobros',
    tags: ['Cobros', 'Ruta'],
    isPinned: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    color: '#0284c7',
  },
];

export function loadProductsFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      saveProductsToStorage(SEED_PRODUCTS);
      return SEED_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_PRODUCTS;
  } catch {
    return SEED_PRODUCTS;
  }
}

export function saveProductsToStorage(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Error guardando productos localmente:', err);
  }
}

export function loadOrdersFromStorage(): ClientOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      saveOrdersToStorage(SEED_ORDERS);
      return SEED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_ORDERS;
  } catch {
    return SEED_ORDERS;
  }
}

export function saveOrdersToStorage(orders: ClientOrder[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Error guardando pedidos localmente:', err);
  }
}

export function loadNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      saveNotesToStorage(SEED_NOTES);
      return SEED_NOTES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_NOTES;
  } catch {
    return SEED_NOTES;
  }
}

export function saveNotesToStorage(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Error guardando notas localmente:', err);
  }
}

export function loadHistoryFromStorage(): CalculationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryToStorage(history: CalculationHistoryItem[]): void {
  try {
    const trimmed = history.slice(0, 60);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Error guardando historial local:', err);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error guardando configuraciones:', err);
  }
}

export function exportBackupJSON(): string {
  const data = {
    version: 2,
    exportDate: new Date().toISOString(),
    products: loadProductsFromStorage(),
    orders: loadOrdersFromStorage(),
    notes: loadNotesFromStorage(),
    history: loadHistoryFromStorage(),
    settings: loadSettingsFromStorage(),
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data) {
      return { success: false, message: 'El archivo está vacío o dañado.' };
    }
    if (Array.isArray(data.products)) {
      saveProductsToStorage(data.products);
    }
    if (Array.isArray(data.orders)) {
      saveOrdersToStorage(data.orders);
    }
    if (Array.isArray(data.notes)) {
      saveNotesToStorage(data.notes);
    }
    if (Array.isArray(data.history)) {
      saveHistoryToStorage(data.history);
    }
    if (data.settings) {
      saveSettingsToStorage(data.settings);
    }
    return {
      success: true,
      message: `Respaldo restaurado con éxito (${data.orders?.length || 0} pedidos, ${data.products?.length || 0} productos).`,
    };
  } catch {
    return { success: false, message: 'Error al interpretar el archivo de respaldo.' };
  }
}
