import type {
  Note,
  CalculationHistoryItem,
  AppSettings,
  Product,
  ClientOrder,
  OrderBatch,
} from '../types';

const KEYS = {
  products: 'cuaderno_calc_products_v1',
  orders: 'cuaderno_calc_orders_v1',
  batches: 'cuaderno_calc_order_batches_v1',
  notes: 'cuaderno_calc_notes_v1',
  history: 'cuaderno_calc_history_v1',
  settings: 'cuaderno_calc_settings_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  hapticSound: true,
  decimalPlaces: 2,
  currencySymbol: '$',
};

// ─── Lectura / escritura genéricas ─────────────────────────────
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readList<T>(key: string): T[] {
  const parsed = read<unknown>(key, []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error guardando datos locales:', err);
  }
}

// Auto-guardado con debounce (300–400 ms) para notas y pedidos; se vacía
// de inmediato si la app pasa a segundo plano para no perder cambios.
const DEBOUNCE_MS = 350;
const pending = new Map<string, { timer: number; value: unknown }>();

function writeDebounced(key: string, value: unknown): void {
  const prev = pending.get(key);
  if (prev) window.clearTimeout(prev.timer);
  const timer = window.setTimeout(() => {
    pending.delete(key);
    write(key, value);
  }, DEBOUNCE_MS);
  pending.set(key, { timer, value });
}

export function flushPendingWrites(): void {
  pending.forEach(({ timer, value }, key) => {
    window.clearTimeout(timer);
    write(key, value);
  });
  pending.clear();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendingWrites);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingWrites();
  });
}

// ─── Datos del cuaderno ────────────────────────────────────────
export const loadProducts = () => readList<Product>(KEYS.products);
export const saveProducts = (v: Product[]) => write(KEYS.products, v);

export const loadOrders = () => readList<ClientOrder>(KEYS.orders);
export const saveOrders = (v: ClientOrder[]) => writeDebounced(KEYS.orders, v);

export const loadBatches = () => readList<OrderBatch>(KEYS.batches);
export const saveBatches = (v: OrderBatch[]) => write(KEYS.batches, v);

export const loadNotes = () => readList<Note>(KEYS.notes);
export const saveNotes = (v: Note[]) => writeDebounced(KEYS.notes, v);

export const loadHistory = () => readList<CalculationHistoryItem>(KEYS.history);
export const saveHistory = (v: CalculationHistoryItem[]) => write(KEYS.history, v.slice(0, 60));

export function loadSettings(): AppSettings {
  const raw = read<Partial<AppSettings>>(KEYS.settings, {});
  return {
    hapticSound: raw.hapticSound ?? DEFAULT_SETTINGS.hapticSound,
    decimalPlaces: raw.decimalPlaces ?? DEFAULT_SETTINGS.decimalPlaces,
    currencySymbol: raw.currencySymbol ?? DEFAULT_SETTINGS.currencySymbol,
  };
}
export const saveSettings = (v: AppSettings) => write(KEYS.settings, v);

// ─── Respaldo JSON ─────────────────────────────────────────────
export function exportBackupJSON(): string {
  flushPendingWrites();
  return JSON.stringify(
    {
      version: 4,
      exportDate: new Date().toISOString(),
      products: loadProducts(),
      orders: loadOrders(),
      orderBatches: loadBatches(),
      notes: loadNotes(),
      history: loadHistory(),
      settings: loadSettings(),
    },
    null,
    2
  );
}

export function importBackupJSON(json: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'El archivo está vacío o dañado.' };
    }
    pending.forEach(({ timer }) => window.clearTimeout(timer));
    pending.clear();
    if (Array.isArray(data.products)) write(KEYS.products, data.products);
    if (Array.isArray(data.orders)) write(KEYS.orders, data.orders);
    if (Array.isArray(data.orderBatches)) write(KEYS.batches, data.orderBatches);
    if (Array.isArray(data.notes)) write(KEYS.notes, data.notes);
    if (Array.isArray(data.history)) saveHistory(data.history);
    if (data.settings) write(KEYS.settings, data.settings);
    return {
      success: true,
      message: `Respaldo restaurado (${data.orders?.length ?? 0} pedidos, ${data.products?.length ?? 0} productos, ${data.notes?.length ?? 0} notas).`,
    };
  } catch {
    return { success: false, message: 'No se pudo leer el archivo de respaldo.' };
  }
}
