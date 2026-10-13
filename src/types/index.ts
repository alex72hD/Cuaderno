export type UnitType = 'kg' | 'lb' | 'g' | 'unidad' | 'paquete';
export type ViewMode = 'split' | 'notes' | 'calculator';

export interface Product {
  id: string;
  name: string;
  price: number; // Precio base por unidad/peso (ej: $18.000 por kg)
  unit: UnitType;
  category?: string;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  pricePerUnit: number;
  weightOrQty: number; // Cantidad o peso (ej: 1.45 kg)
  unit: UnitType;
  subtotal: number; // weightOrQty * pricePerUnit
  notes?: string;
}

export interface ClientOrder {
  id: string;
  clientName: string;
  clientPhone?: string;
  status: 'pendiente' | 'entregado' | 'pagado';
  date: number; // fecha del pedido
  items: OrderItem[];
  discount: number;
  deposit: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: number;
  formattedResult: string;
  timestamp: number;
  noteId?: string;
  noteTitle?: string;
}

export type NotebookTab = 'pedidos' | 'productos' | 'notas' | 'calculadora';

export type AppTheme = 'dark' | 'paper' | 'light';

export interface AppSettings {
  theme: AppTheme;
  hapticSound: boolean;
  decimalPlaces: number;
  taxRate: number;
  currencySymbol: string;
  defaultUnit: UnitType;
  insertFormat: 'result_only' | 'expr_and_result' | 'breakdown';
}
