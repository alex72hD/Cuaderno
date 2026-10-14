import { create } from 'zustand';
import type { ClientOrder, OrderBatch, OrderItem, Product, UnitType } from '../types';
import {
  loadOrdersFromStorage,
  saveOrdersToStorage,
  loadOrderBatchesFromStorage,
  saveOrderBatchesToStorage,
  loadProductsFromStorage,
  saveProductsToStorage,
} from '../storage/localStore';
import { roundToPrecision } from '../utils/mathEngine';

interface OrdersState {
  orders: ClientOrder[];
  orderBatches: OrderBatch[];
  products: Product[];
  activeBatchId: string | null;
  activeOrderId: string | null;
  searchQuery: string;
  statusFilter: 'todos' | 'pendiente' | 'entregado' | 'pagado';

  // Acciones de Pedidos
  setActiveOrderId: (id: string | null) => void;
  setActiveBatchId: (id: string | null) => void;
  setOrderBatch: (orderId: string, batchId: string | null) => void;
  createOrderBatch: (name: string) => string;
  deleteOrderBatch: (id: string) => void;
  createOrder: (clientName?: string, batchId?: string | null) => string;
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

export const useOrdersStore = create<OrdersState>((set, get) => {
  const orders = loadOrdersFromStorage();
  const orderBatches = loadOrderBatchesFromStorage();
  const activeBatchId = orderBatches[0]?.id || null;
  const activeOrderId = orders[0]?.id || null;

  return {
    orders,
    orderBatches,
    products: loadProductsFromStorage(),
    activeBatchId,
    activeOrderId,
    searchQuery: '',
    statusFilter: 'todos',

  setActiveOrderId: (id) => set({ activeOrderId: id }),
  setActiveBatchId: (id) => set({ activeBatchId: id }),

  setOrderBatch: (orderId, batchId) => {
    const nextOrders = get().orders.map((o) =>
      o.id === orderId
        ? { ...o, batchId: batchId || undefined, updatedAt: Date.now() }
        : o
    );
    saveOrdersToStorage(nextOrders);
    set({ orders: nextOrders });
  },

  createOrderBatch: (name) => {
    const batch: OrderBatch = {
      id: 'batch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      createdAt: Date.now(),
    };
    const nextBatches = [batch, ...get().orderBatches];
    saveOrderBatchesToStorage(nextBatches);
    set({ orderBatches: nextBatches, activeBatchId: batch.id });
    return batch.id;
  },

  deleteOrderBatch: (id) => {
    const nextBatches = get().orderBatches.filter((batch) => batch.id !== id);
    const nextOrders = get().orders.filter((order) => order.batchId !== id);
    const nextActiveBatchId =
      get().activeBatchId === id ? nextBatches[0]?.id || null : get().activeBatchId;
    const nextActiveOrderId =
      get().activeOrderId && nextOrders.some((order) => order.id === get().activeOrderId)
        ? get().activeOrderId
        : nextOrders[0]?.id || null;

    saveOrderBatchesToStorage(nextBatches);
    saveOrdersToStorage(nextOrders);
    set({
      orderBatches: nextBatches,
      orders: nextOrders,
      activeBatchId: nextActiveBatchId,
      activeOrderId: nextActiveOrderId,
    });
  },

  createOrder: (clientName = 'Nuevo Cliente', batchId = null) => {
    const newOrder: ClientOrder = {
      id: 'order-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      batchId: batchId || undefined,
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
    const currentState = get();
    const nextActive =
      currentState.activeOrderId === id
        ? filtered[0]?.id || null
        : currentState.activeOrderId;
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
    const batches = loadOrderBatchesFromStorage();
    const prods = loadProductsFromStorage();
    const batchId = batches[0]?.id || null;
    const orderId = ords[0]?.id || null;
    set({
      orders: ords,
      orderBatches: batches,
      products: prods,
      activeBatchId: batchId,
      activeOrderId: orderId,
    });
  },
  };
});

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
