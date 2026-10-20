export type UnitType = 'kg' | 'lb' | 'g' | 'unidad' | 'paquete';

export interface Product {
  id: string;
  name: string;
  price: number; // Precio por unidad/peso (ej: 18000 por kg)
  unit: UnitType;
}

export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  pricePerUnit: number;
  weightOrQty: number;
  unit: UnitType;
  subtotal: number; // weightOrQty * pricePerUnit
}

export interface ClientOrder {
  id: string;
  batchId?: string;
  clientName: string;
  clientPhone?: string;
  status: 'pendiente' | 'pagado';
  date: number;
  items: OrderItem[];
  discount: number;
  deposit: number;
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface OrderBatch {
  id: string;
  name: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: number;
  formattedResult: string;
  timestamp: number;
}

export interface AppSettings {
  hapticSound: boolean;
  decimalPlaces: number;
  currencySymbol: string;
}
