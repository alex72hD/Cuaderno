import type {
  Note,
  CalculationHistoryItem,
  AppSettings,
  Product,
  ClientOrder,
  OrderBatch,
} from '../types';

const PRODUCTS_KEY = 'cuaderno_calc_products_v1';
const ORDERS_KEY = 'cuaderno_calc_orders_v1';
const ORDER_BATCHES_KEY = 'cuaderno_calc_order_batches_v1';
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

// IDs de datos de prueba antiguos a descartar si estaban en localStorage
const MOCK_PROD_IDS = new Set(['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7', 'prod-8']);
const MOCK_ORDER_IDS = new Set(['order-1', 'order-2']);
const MOCK_NOTE_IDS = new Set(['seed-note-1']);

export function loadProductsFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const clean = parsed.filter((p: Product) => !MOCK_PROD_IDS.has(p.id));
    if (clean.length !== parsed.length) {
      saveProductsToStorage(clean);
    }
    return clean;
  } catch {
    return [];
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const clean = parsed.filter((o: ClientOrder) => !MOCK_ORDER_IDS.has(o.id));
    if (clean.length !== parsed.length) {
      saveOrdersToStorage(clean);
    }
    return clean;
  } catch {
    return [];
  }
}

export function saveOrdersToStorage(orders: ClientOrder[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Error guardando pedidos localmente:', err);
  }
}

export function loadOrderBatchesFromStorage(): OrderBatch[] {
  try {
    const raw = localStorage.getItem(ORDER_BATCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrderBatchesToStorage(batches: OrderBatch[]): void {
  try {
    localStorage.setItem(ORDER_BATCHES_KEY, JSON.stringify(batches));
  } catch (err) {
    console.error('Error guardando grupos de pedidos localmente:', err);
  }
}

export function loadNotesFromStorage(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const clean = parsed.filter((n: Note) => !MOCK_NOTE_IDS.has(n.id));
    if (clean.length !== parsed.length) {
      saveNotesToStorage(clean);
    }
    return clean;
  } catch {
    return [];
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
    version: 3,
    exportDate: new Date().toISOString(),
    products: loadProductsFromStorage(),
    orders: loadOrdersFromStorage(),
    orderBatches: loadOrderBatchesFromStorage(),
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
    saveOrderBatchesToStorage(Array.isArray(data.orderBatches) ? data.orderBatches : []);
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
