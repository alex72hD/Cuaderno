import { create } from 'zustand';
import type { ClientOrder, OrderItem, Product, UnitType } from '../types';
import {
  loadOrdersFromStorage,
  saveOrdersToStorage,
  loadProductsFromStorage,
  saveProductsToStorage,
} from '../storage/localStore';
import { roundToPrecision } from '../utils/mathEngine';

interface OrdersState {
  orders: ClientOrder[];
  products: Product[];
  activeOrderId: string | null;
  searchQuery: string;
  statusFilter: 'todos' | 'pendiente' | 'entregado' | 'pagado';

  // Acciones de Pedidos
  setActiveOrderId: (id: string | null) => void;
  createOrder: (clientName?: string) => string;
  updateOrder: (id: string, updates: Partial<ClientOrder>) => void;
  deleteOrder: (id: string) => void;
  addItemToOrder: (
    orderId: string,
    data: {
      productId?: string;
      productName: string;
      pricePerUnit: number;
      weightOrQty: number;
      unit: UnitType;
      notes?: string;
    }
  ) => void;
  updateOrderItem: (
    orderId: string,
    itemId: string,
    updates: Partial<OrderItem>
  ) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;

  // Acciones de Catálogo de Productos
  addProduct: (data: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Filtros
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: 'todos' | 'pendiente' | 'entregado' | 'pagado') => void;
  reloadAll: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: loadOrdersFromStorage(),
  products: loadProductsFromStorage(),
  activeOrderId: loadOrdersFromStorage()[0]?.id || null,
  searchQuery: '',
  statusFilter: 'todos',

  setActiveOrderId: (id) => set({ activeOrderId: id }),

  createOrder: (clientName = 'Nuevo Cliente') => {
    const newOrder: ClientOrder = {
      id: 'order-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      clientName: clientName.trim() || 'Cliente Sin Nombre',
      clientPhone: '',
      status: 'pendiente',
      date: Date.now(),
      items: [],
      discount: 0,
      deposit: 0,
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const nextOrders = [newOrder, ...get().orders];
    saveOrdersToStorage(nextOrders);
    set({ orders: nextOrders, activeOrderId: newOrder.id });
    return newOrder.id;
  },

  updateOrder: (id, updates) => {
    const nextOrders = get().orders.map((o) =>
      o.id === id ? { ...o, ...updates, updatedAt: Date.now() } : o
    );
    saveOrdersToStorage(nextOrders);
    set({ orders: nextOrders });
  },

  deleteOrder: (id) => {
    const filtered = get().orders.filter((o) => o.id !== id);
    saveOrdersToStorage(filtered);
    const nextActive = get().activeOrderId === id ? filtered[0]?.id || null : get().activeOrderId;
    set({ orders: filtered, activeOrderId: nextActive });
  },

  addItemToOrder: (orderId, data) => {
    // Cálculo instantáneo: peso/cantidad * precio unitario
    const subtotal = roundToPrecision(data.weightOrQty * data.pricePerUnit, 2);

    const newItem: OrderItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      productId: data.productId,
      productName: data.productName,
      pricePerUnit: data.pricePerUnit,
      weightOrQty: data.weightOrQty,
      unit: data.unit,
      subtotal,
      notes: data.notes,
    };

    const nextOrders = get().orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          items: [...o.items, newItem],
          updatedAt: Date.now(),
        };
      }
      return o;
    });

    saveOrdersToStorage(nextOrders);
    set({ orders: nextOrders });
  },

  updateOrderItem: (orderId, itemId, updates) => {
    const nextOrders = get().orders.map((o) => {
      if (o.id === orderId) {
        const nextItems = o.items.map((item) => {
          if (item.id === itemId) {
            const merged = { ...item, ...updates };
            // Recalcular subtotal en el acto
            merged.subtotal = roundToPrecision(merged.weightOrQty * merged.pricePerUnit, 2);
            return merged;
          }
          return item;
        });
        return { ...o, items: nextItems, updatedAt: Date.now() };
      }
      return o;
    });

    saveOrdersToStorage(nextOrders);
    set({ orders: nextOrders });
  },

  removeItemFromOrder: (orderId, itemId) => {
    const nextOrders = get().orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.filter((i) => i.id !== itemId),
          updatedAt: Date.now(),
        };
      }
      return o;
    });

    saveOrdersToStorage(nextOrders);
    set({ orders: nextOrders });
  },

  addProduct: (data) => {
    const newProd: Product = {
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: data.name,
      price: data.price,
      unit: data.unit,
      category: data.category || 'General',
    };

    const nextProds = [...get().products, newProd];
    saveProductsToStorage(nextProds);
    set({ products: nextProds });
    return newProd;
  },

  updateProduct: (id, updates) => {
    const nextProds = get().products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    saveProductsToStorage(nextProds);
    set({ products: nextProds });
  },

  deleteProduct: (id) => {
    const nextProds = get().products.filter((p) => p.id !== id);
    saveProductsToStorage(nextProds);
    set({ products: nextProds });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  reloadAll: () => {
    const ords = loadOrdersFromStorage();
    const prods = loadProductsFromStorage();
    set({ orders: ords, products: prods, activeOrderId: ords[0]?.id || null });
  },
}));

/**
 * Función auxiliar para calcular totales de un pedido en tiempo real
 */
export function calculateOrderTotals(order: ClientOrder) {
  const itemsSubtotal = order.items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const total = Math.max(0, itemsSubtotal - (order.discount || 0));
  const pendingBalance = total - (order.deposit || 0);

  return {
    itemsCount: order.items.length,
    itemsSubtotal: roundToPrecision(itemsSubtotal, 2),
    discount: order.discount || 0,
    total: roundToPrecision(total, 2),
    deposit: order.deposit || 0,
    balance: roundToPrecision(pendingBalance, 2),
    isPaid: pendingBalance <= 0 && total > 0,
  };
}
