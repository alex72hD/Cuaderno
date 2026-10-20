import { create } from 'zustand';
import type { ClientOrder, OrderBatch, OrderItem, Product, UnitType } from '../types';
import {
  loadOrders,
  saveOrders,
  loadBatches,
  saveBatches,
  loadProducts,
  saveProducts,
} from '../storage/localStore';
import { roundToPrecision } from '../utils/mathEngine';

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

interface OrdersState {
  orders: ClientOrder[];
  orderBatches: OrderBatch[];
  products: Product[];
  activeOrderId: string | null; // null = índice de pedidos

  setActiveOrderId: (id: string | null) => void;
  setOrderBatch: (orderId: string, batchId: string | null) => void;
  createOrderBatch: (name: string) => string;
  deleteOrderBatch: (id: string) => void;
  createOrder: (clientName?: string, batchId?: string | null) => string;
  updateOrder: (id: string, updates: Partial<ClientOrder>) => void;
  deleteOrder: (id: string) => void;
  addItemToOrder: (
    orderId: string,
    data: Omit<OrderItem, 'id' | 'subtotal'>
  ) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;

  addProduct: (data: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  reloadAll: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => {
  const commitOrders = (orders: ClientOrder[], extra: Partial<OrdersState> = {}) => {
    saveOrders(orders);
    set({ orders, ...extra });
  };
  const patchOrder = (id: string, fn: (o: ClientOrder) => ClientOrder) =>
    commitOrders(get().orders.map((o) => (o.id === id ? { ...fn(o), updatedAt: Date.now() } : o)));
  const commitProducts = (products: Product[]) => {
    saveProducts(products);
    set({ products });
  };

  return {
    orders: loadOrders(),
    orderBatches: loadBatches(),
    products: loadProducts(),
    activeOrderId: null,

    setActiveOrderId: (id) => set({ activeOrderId: id }),

    setOrderBatch: (orderId, batchId) => patchOrder(orderId, (o) => ({ ...o, batchId: batchId || undefined })),

    createOrderBatch: (name) => {
      const batch: OrderBatch = { id: uid('batch'), name: name.trim(), createdAt: Date.now() };
      const orderBatches = [batch, ...get().orderBatches];
      saveBatches(orderBatches);
      set({ orderBatches });
      return batch.id;
    },

    // Elimina el grupo y los pedidos de sus clientes
    deleteOrderBatch: (id) => {
      const orderBatches = get().orderBatches.filter((b) => b.id !== id);
      saveBatches(orderBatches);
      const orders = get().orders.filter((o) => o.batchId !== id);
      const active = get().activeOrderId;
      commitOrders(orders, {
        orderBatches,
        activeOrderId: active && orders.some((o) => o.id === active) ? active : null,
      });
    },

    createOrder: (clientName = '', batchId = null) => {
      const now = Date.now();
      const order: ClientOrder = {
        id: uid('order'),
        batchId: batchId || undefined,
        clientName: clientName.trim() || 'Cliente',
        clientPhone: '',
        status: 'pendiente',
        date: now,
        items: [],
        discount: 0,
        deposit: 0,
        notes: '',
        createdAt: now,
        updatedAt: now,
      };
      commitOrders([order, ...get().orders], { activeOrderId: order.id });
      return order.id;
    },

    updateOrder: (id, updates) => patchOrder(id, (o) => ({ ...o, ...updates })),

    deleteOrder: (id) =>
      commitOrders(
        get().orders.filter((o) => o.id !== id),
        get().activeOrderId === id ? { activeOrderId: null } : {}
      ),

    addItemToOrder: (orderId, data) => {
      const item: OrderItem = {
        ...data,
        id: uid('item'),
        subtotal: roundToPrecision(data.weightOrQty * data.pricePerUnit, 2),
      };
      patchOrder(orderId, (o) => ({ ...o, items: [...o.items, item] }));
    },

    removeItemFromOrder: (orderId, itemId) =>
      patchOrder(orderId, (o) => ({ ...o, items: o.items.filter((i) => i.id !== itemId) })),

    addProduct: (data) => commitProducts([...get().products, { ...data, id: uid('prod') }]),
    updateProduct: (id, updates) =>
      commitProducts(get().products.map((p) => (p.id === id ? { ...p, ...updates } : p))),
    deleteProduct: (id) => commitProducts(get().products.filter((p) => p.id !== id)),

    reloadAll: () =>
      set({
        orders: loadOrders(),
        orderBatches: loadBatches(),
        products: loadProducts(),
        activeOrderId: null,
      }),
  };
});

/** Totales de un pedido, recalculados en tiempo real. */
export function calculateOrderTotals(order: ClientOrder) {
  const itemsSubtotal = order.items.reduce((acc, i) => acc + i.subtotal, 0);
  const total = Math.max(0, itemsSubtotal - (order.discount || 0));
  return {
    itemsCount: order.items.length,
    itemsSubtotal: roundToPrecision(itemsSubtotal, 2),
    total: roundToPrecision(total, 2),
    balance: roundToPrecision(total - (order.deposit || 0), 2),
  };
}

export type { UnitType };
