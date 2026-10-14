import React, { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { useOrdersStore, calculateOrderTotals } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import type { Product } from '../types';
import { formatNumber, roundToPrecision } from '../utils/mathEngine';
import { playKeyClick, playActionSuccess, triggerHaptic } from '../utils/sound';

interface OrderSheetProps {
  onBackToList?: () => void;
  onOpenProductCatalog?: () => void;
}

export const OrderSheet: React.FC<OrderSheetProps> = ({
  onBackToList,
  onOpenProductCatalog,
}) => {
  const {
    orders,
    activeOrderId,
    products,
    orderBatches,
    setOrderBatch,
    updateOrder,
    deleteOrder,
    addItemToOrder,
    removeItemFromOrder,
  } = useOrdersStore();

  const { settings } = useCalculatorStore();

  const activeOrder = orders.find((o) => o.id === activeOrderId);
  const currentBatch = orderBatches.find((b) => b.id === activeOrder?.batchId);

  // Estados para pesar y agregar producto en tiempo real
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    products[0] || null
  );
  const [weightInput, setWeightInput] = useState<string>('');
  const [customProductName, setCustomProductName] = useState<string>('');
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(products.length === 0);
  const [showAddItemDrawer, setShowAddItemDrawer] = useState<boolean>(false);

  // Estados de edición del cliente
  const [isEditingClient, setIsEditingClient] = useState<boolean>(false);
  const [clientNameInput, setClientNameInput] = useState<string>('');
  const [clientPhoneInput, setClientPhoneInput] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Totales calculados en tiempo real
  const totals = useMemo(() => {
    if (!activeOrder) return null;
    return calculateOrderTotals(activeOrder);
  }, [activeOrder]);

  // Cálculo en vivo mientras se digita el peso
  const liveSubtotal = useMemo(() => {
    const rawWeight = parseFloat(weightInput.replace(',', '.')) || 0;
    const price = isCustomMode
      ? parseFloat(customPriceInput.replace(/\./g, '').replace(',', '.')) || 0
      : selectedProduct?.price || 0;
    return roundToPrecision(rawWeight * price, 2);
  }, [weightInput, selectedProduct, isCustomMode, customPriceInput]);

  if (!activeOrder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500">
        <Scale className="w-9 h-9 mb-2 opacity-40 text-stone-400" />
        <p className="text-xs font-medium">Selecciona un pedido o crea uno nuevo para empezar.</p>
      </div>
    );
  }

  // Manejar adición instantánea de producto con su peso
  const handleAddWeightItem = () => {
    const weightNum = parseFloat(weightInput.replace(',', '.')) || 0;
    if (weightNum <= 0) return;

    playActionSuccess(settings.hapticSound);
    triggerHaptic(20);

    if (isCustomMode) {
      const priceNum =
        parseFloat(customPriceInput.replace(/\./g, '').replace(',', '.')) || 0;
      if (!customProductName.trim() || priceNum <= 0) return;

      addItemToOrder(activeOrder.id, {
        productName: customProductName.trim(),
        pricePerUnit: priceNum,
        weightOrQty: weightNum,
        unit: 'kg',
      });
      setCustomProductName('');
      setCustomPriceInput('');
    } else if (selectedProduct) {
      addItemToOrder(activeOrder.id, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        pricePerUnit: selectedProduct.price,
        weightOrQty: weightNum,
        unit: selectedProduct.unit,
      });
    }

    setWeightInput('');
    setShowAddItemDrawer(false);
  };

  // Botón numérico táctil para ingresar el peso rápido
  const handleNumpadPress = (char: string) => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(8);
    if (char === 'DEL') {
      setWeightInput((prev) => prev.slice(0, -1));
    } else if (char === '.' || char === ',') {
      if (!weightInput.includes('.') && !weightInput.includes(',')) {
        setWeightInput((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      setWeightInput((prev) => prev + char);
    }
  };

  // Guardar cambios en el nombre del cliente
  const handleSaveClientDetails = () => {
    if (clientNameInput.trim()) {
      updateOrder(activeOrder.id, {
        clientName: clientNameInput.trim(),
        clientPhone: clientPhoneInput.trim(),
      });
    }
    setIsEditingClient(false);
  };

  // Compartir formato de recibo / pedido por WhatsApp
  const handleShareOrder = async () => {
    if (!totals) return;
    const lines = [
      `📋 *CUADERNO DE PEDIDOS*`,
      currentBatch ? `📦 *Grupo:* ${currentBatch.name}` : '',
      `👤 *Cliente:* ${activeOrder.clientName}`,
      activeOrder.clientPhone ? `📞 *Tel:* ${activeOrder.clientPhone}` : '',
      `📅 *Fecha:* ${new Date(activeOrder.date).toLocaleDateString('es-CO')}`,
      `---------------------------------`,
      ...activeOrder.items.map(
        (i) =>
          `• *${i.productName}:* ${i.weightOrQty} ${i.unit} × ${settings.currencySymbol}${formatNumber(
            i.pricePerUnit
          )} = *${settings.currencySymbol}${formatNumber(i.subtotal)}*`
      ),
      `---------------------------------`,
      `*SUBTOTAL:* ${settings.currencySymbol}${formatNumber(totals.itemsSubtotal)}`,
      activeOrder.discount > 0
        ? `*DESCUENTO:* -${settings.currencySymbol}${formatNumber(activeOrder.discount)}`
        : '',
      `💰 *TOTAL A COBRAR:* ${settings.currencySymbol}${formatNumber(totals.total)}`,
      activeOrder.deposit > 0
        ? `*ABONO RECIBIDO:* ${settings.currencySymbol}${formatNumber(activeOrder.deposit)}`
        : '',
      activeOrder.deposit > 0
        ? `*SALDO PENDIENTE:* ${settings.currencySymbol}${formatNumber(totals.balance)}`
        : '',
      activeOrder.notes ? `\n📝 *Nota:* ${activeOrder.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedShare(true);
      triggerHaptic(15);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      //
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf8f5] dark:bg-slate-950 text-stone-900 dark:text-slate-100 overflow-hidden font-sans relative">
      {/* ============================================================== */}
      {/* CABECERA LIMPIA Y LIGERA DEL PEDIDO                            */}
      {/* ============================================================== */}
      <div className="px-3 py-2 bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="p-1 rounded-lg text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white active:scale-95 transition-all"
              title="Volver"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0">
            {isEditingClient ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder="Nombre del cliente"
                  className="bg-stone-100 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-stone-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleSaveClientDetails}
                  className="p-1 text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-stone-900 dark:text-white truncate">
                  {activeOrder.clientName}
                </h2>
                <button
                  onClick={() => {
                    setClientNameInput(activeOrder.clientName);
                    setClientPhoneInput(activeOrder.clientPhone || '');
                    setIsEditingClient(true);
                  }}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200"
                  title="Editar nombre"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Asignación y badge de grupo en el pedido */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-stone-400 dark:text-slate-500">Grupo:</span>
                <select
                  value={activeOrder.batchId || ''}
                  onChange={(e) => setOrderBatch(activeOrder.id, e.target.value || null)}
                  className="text-[10px] bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-stone-700 dark:text-slate-300 font-medium focus:outline-none"
                >
                  <option value="">Sin grupo (Individual)</option>
                  {orderBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              {activeOrder.clientPhone && (
                <span className="text-[10px] text-stone-400 dark:text-slate-500">
                  📞 {activeOrder.clientPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Pedido */}
        <div className="flex items-center gap-1">
          {/* Toggle Estado Pagado/Pendiente */}
          <button
            onClick={() => {
              playKeyClick(settings.hapticSound);
              updateOrder(activeOrder.id, {
                status: activeOrder.status === 'pagado' ? 'pendiente' : 'pagado',
              });
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              activeOrder.status === 'pagado'
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-900'
            }`}
          >
            {activeOrder.status === 'pagado' ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>PAGADO</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span>PENDIENTE</span>
              </>
            )}
          </button>

          {/* Compartir por WhatsApp */}
          <button
            onClick={handleShareOrder}
            title="Copiar resumen para WhatsApp"
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Eliminar Pedido */}
          <button
            onClick={() => {
              if (confirm('¿Eliminar este pedido del cuaderno?')) {
                deleteOrder(activeOrder.id);
                if (onBackToList) onBackToList();
              }
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400"
            title="Eliminar pedido"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* CUERPO DEL PEDIDO: PRODUCTOS Y TOTALES                        */}
      {/* ============================================================== */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Barra de acción para Pesar Producto (compacta y limpia) */}
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-slate-300">
            <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold">
              Productos pesados ({activeOrder.items.length})
            </span>
          </div>

          <button
            onClick={() => {
              playKeyClick(settings.hapticSound);
              setShowAddItemDrawer(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Pesar producto</span>
          </button>
        </div>

        {/* Tabla de Productos del Pedido */}
        <div className="border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <div className="bg-stone-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-stone-500 dark:text-slate-400 grid grid-cols-12 gap-1 border-b border-stone-200 dark:border-slate-800">
            <span className="col-span-5">Producto</span>
            <span className="col-span-3 text-right">Peso/Cant</span>
            <span className="col-span-3 text-right">Subtotal</span>
            <span className="col-span-1 text-center"></span>
          </div>

          {activeOrder.items.length === 0 ? (
            <div className="py-7 text-center text-stone-400 dark:text-slate-500 text-xs">
              No has pesado ningún producto aún para este cliente.
              <br />
              <button
                onClick={() => setShowAddItemDrawer(true)}
                className="mt-2 text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                + Pesar primer producto
              </button>
            </div>
          ) : (
            activeOrder.items.map((item, idx) => (
              <div
                key={item.id}
                className={`px-2.5 py-2 grid grid-cols-12 gap-1 items-center text-xs border-b border-stone-100 dark:border-slate-800/50 ${
                  idx % 2 === 0
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-[#faf8f5] dark:bg-slate-900/40'
                }`}
              >
                {/* Nombre y Precio Unitario */}
                <div className="col-span-5 min-w-0 pr-1">
                  <p className="font-semibold text-stone-900 dark:text-white truncate">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-stone-400 dark:text-slate-400">
                    {settings.currencySymbol}
                    {formatNumber(item.pricePerUnit)} /{item.unit}
                  </p>
                </div>

                {/* Peso */}
                <div className="col-span-3 text-right font-mono font-medium text-stone-700 dark:text-slate-200">
                  <span className="bg-stone-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] border border-stone-200 dark:border-slate-700">
                    {item.weightOrQty} {item.unit}
                  </span>
                </div>

                {/* Subtotal Calculado */}
                <div className="col-span-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {settings.currencySymbol}
                  {formatNumber(item.subtotal)}
                </div>

                {/* Borrar Item */}
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => {
                      removeItemFromOrder(activeOrder.id, item.id);
                      triggerHaptic(5);
                    }}
                    className="text-stone-300 hover:text-rose-500 dark:hover:text-rose-400 p-1"
                    title="Quitar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Nota libre del pedido */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-stone-200 dark:border-slate-800">
          <label className="text-[10px] font-semibold text-stone-400 dark:text-slate-500 uppercase tracking-wide block mb-0.5">
            Notas de Entrega o Detalles
          </label>
          <input
            type="text"
            value={activeOrder.notes || ''}
            onChange={(e) => updateOrder(activeOrder.id, { notes: e.target.value })}
            placeholder="Ej: Dejar donde el vecino, pagar por transferencia..."
            className="w-full bg-transparent text-xs text-stone-800 dark:text-slate-200 placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* TOTALIZADOR DEL CUADERNO (LIMPIO Y COMPACTO)                   */}
      {/* ============================================================== */}
      {totals && (
        <div className="bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 px-3 py-2 shadow-sm select-none">
          {/* Fila de Ajustes de Descuento y Abono */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-1.5 pb-1.5 border-b border-stone-100 dark:border-slate-800">
            <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-stone-200/60 dark:border-slate-800">
              <span className="text-[10px] text-stone-500 dark:text-slate-400">Descuento:</span>
              <div className="flex items-center font-mono">
                <span className="text-[10px] text-stone-400 mr-0.5">$</span>
                <input
                  type="number"
                  value={activeOrder.discount || ''}
                  onChange={(e) =>
                    updateOrder(activeOrder.id, {
                      discount: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                  className="w-16 text-right text-xs bg-transparent font-bold focus:outline-none text-rose-600 dark:text-rose-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-stone-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-stone-200/60 dark:border-slate-800">
              <span className="text-[10px] text-stone-500 dark:text-slate-400">Abono:</span>
              <div className="flex items-center font-mono">
                <span className="text-[10px] text-stone-400 mr-0.5">$</span>
                <input
                  type="number"
                  value={activeOrder.deposit || ''}
                  onChange={(e) =>
                    updateOrder(activeOrder.id, {
                      deposit: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                  className="w-16 text-right text-xs bg-transparent font-bold focus:outline-none text-sky-600 dark:text-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Gran Total y Saldo Pendiente */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 dark:text-slate-400 block leading-tight">
                {totals.itemsCount} producto(s)
              </span>
              <span className="text-xs font-semibold text-stone-600 dark:text-slate-300">
                Total:{' '}
                <span className="text-stone-900 dark:text-white font-mono font-bold">
                  {settings.currencySymbol}
                  {formatNumber(totals.total)}
                </span>
              </span>
            </div>

            {/* Saldo a Cobrar */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide block leading-tight">
                Saldo a Cobrar
              </span>
              <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
                {settings.currencySymbol}
                {formatNumber(totals.balance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRAWER / TECLADO DE PESO INTEGRADO ("Pesar Producto")          */}
      {/* ============================================================== */}
      {showAddItemDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
          <div className="w-full max-w-md bg-[#faf7ef] dark:bg-slate-900 border-t-2 border-amber-500 rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header del Drawer */}
            <div className="p-3 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Pesar y Calcular en Vivo
                </h3>
              </div>
              <button
                onClick={() => setShowAddItemDrawer(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Productos */}
            <div className="p-3 space-y-2.5 overflow-y-auto">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-600 dark:text-slate-400">
                  Selecciona el Producto:
                </label>
                {onOpenProductCatalog && (
                  <button
                    onClick={onOpenProductCatalog}
                    className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold underline"
                  >
                    Editar Lista de Precios
                  </button>
                )}
              </div>

              {/* Chips de Productos con Precios */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {products.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      playKeyClick(settings.hapticSound);
                      setSelectedProduct(prod);
                      setIsCustomMode(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs flex-shrink-0 text-left border transition-all ${
                      !isCustomMode && selectedProduct?.id === prod.id
                        ? 'bg-amber-600 text-white border-amber-700 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-300 dark:border-slate-700'
                    }`}
                  >
                    <p className="truncate max-w-[120px]">{prod.name}</p>
                    <p
                      className={`text-[10px] ${
                        !isCustomMode && selectedProduct?.id === prod.id
                          ? 'text-amber-100'
                          : 'text-stone-500 dark:text-slate-400 font-mono'
                      }`}
                    >
                      {settings.currencySymbol}
                      {formatNumber(prod.price)} /{prod.unit}
                    </p>
                  </button>
                ))}

                {/* Opción Producto Personalizado */}
                <button
                  onClick={() => {
                    setIsCustomMode(true);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs flex-shrink-0 text-left border transition-all ${
                    isCustomMode
                      ? 'bg-amber-600 text-white border-amber-700 font-bold'
                      : 'bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-300 dark:border-slate-700'
                  }`}
                >
                  <p>+ Otro Producto</p>
                  <p className="text-[10px] opacity-75">Personalizado</p>
                </button>
              </div>

              {/* Si es modo personalizado */}
              {isCustomMode && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700">
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-0.5">Nombre:</label>
                    <input
                      type="text"
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      placeholder="Ej: Quesillo"
                      className="w-full bg-stone-100 dark:bg-slate-700 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-0.5">Precio / kg:</label>
                    <input
                      type="number"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      placeholder="Ej: 22000"
                      className="w-full bg-stone-100 dark:bg-slate-700 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* PANTALLA EN VIVO DEL PESO Y SUBTOTAL */}
              <div className="bg-stone-900 text-white rounded-2xl p-3 border border-stone-800 shadow-inner">
                <div className="flex items-center justify-between text-xs text-amber-400 font-medium pb-1">
                  <span>
                    {isCustomMode ? customProductName || 'Otro' : selectedProduct?.name} (
                    {settings.currencySymbol}
                    {formatNumber(
                      isCustomMode
                        ? parseFloat(customPriceInput) || 0
                        : selectedProduct?.price || 0
                    )}
                    /kg)
                  </span>
                  <span className="font-mono text-stone-400">Peso digitado</span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-stone-800">
                  <div className="font-mono text-2xl font-bold text-amber-300">
                    {weightInput || '0'}{' '}
                    <span className="text-sm font-sans text-stone-400">kg</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block leading-none">Subtotal:</span>
                    <span className="text-xl font-mono font-bold text-emerald-400">
                      {settings.currencySymbol} {formatNumber(liveSubtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accesos rápidos de peso común */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
                {['0.5', '1.0', '1.5', '2.0'].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      playKeyClick(settings.hapticSound);
                      setWeightInput(val);
                    }}
                    className="py-1 rounded-lg bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-center active:scale-95"
                  >
                    +{val} kg
                  </button>
                ))}
              </div>

              {/* Teclado Numérico Ergonómico Táctil para Peso */}
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleNumpadPress(k)}
                    className={`h-11 rounded-xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center ${
                      k === 'DEL'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-white dark:bg-slate-800 text-stone-900 dark:text-white border border-stone-200 dark:border-slate-700 shadow-xs'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Botón de Inserción Directa al Pedido */}
              <button
                onClick={handleAddWeightItem}
                disabled={liveSubtotal <= 0}
                className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  liveSubtotal > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.98]'
                    : 'bg-stone-300 dark:bg-slate-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Sumar al Pedido ({settings.currencySymbol}{formatNumber(liveSubtotal)})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
