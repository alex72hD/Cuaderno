import React, { useState } from 'react';
import {
  BookOpen,
  Calculator as CalcIcon,
  ClipboardList,
  Package,
  X,
  FilePlus,
  UserPlus,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Users,
} from 'lucide-react';
import { useCalculatorStore } from './store/useCalculatorStore';
import { useNotesStore } from './store/useNotesStore';
import { useOrdersStore } from './store/useOrdersStore';
import { Calculator } from './components/Calculator';
import { NoteEditor } from './components/NoteEditor';
import { NoteList } from './components/NoteList';
import { OrderSheet } from './components/OrderSheet';
import { CalcHistoryModal } from './components/CalcHistoryModal';
import { BackupModal } from './components/BackupModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { formatNumber } from './utils/mathEngine';
import { calculateOrderTotals } from './store/useOrdersStore';

// Tab principal del cuaderno
type MainTab = 'pedidos' | 'grupos' | 'notas' | 'calculadora';
// Sub-tab dentro de notas
type NoteTab = 'editor' | 'lista';

export function App() {
  const { isDrawerOpen, toggleDrawer, settings } = useCalculatorStore();
  const { createNote, setActiveNoteId } = useNotesStore();
  const {
    orders,
    orderBatches,
    activeBatchId,
    createOrder,
    createOrderBatch,
    deleteOrderBatch,
    setActiveBatchId,
    setActiveOrderId,
    activeOrderId,
  } = useOrdersStore();

  const [mainTab, setMainTab] = useState<MainTab>('pedidos');
  const [noteTab, setNoteTab] = useState<NoteTab>('lista');
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [showNewOrderInput, setShowNewOrderInput] = useState(false);
  const [showNewBatchClientInput, setShowNewBatchClientInput] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [showNewBatchInput, setShowNewBatchInput] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('todos');

  // ─── Tema Visual Aligerado ─────────────────────────────────────
  const isPaper = settings.theme === 'paper';
  const isLight = settings.theme === 'light';
  const bgOuter = isPaper ? 'bg-[#f4efe6]' : isLight ? 'bg-slate-100' : 'bg-slate-950';
  const containerCls = isPaper
    ? 'bg-[#fdfbf7] text-stone-900 border-stone-200'
    : isLight
    ? 'bg-white text-slate-900 border-slate-200'
    : 'bg-[#0c111d] text-slate-100 border-slate-800';
  const tabBarCls = isPaper
    ? 'bg-[#f8f5ee] border-stone-200 text-stone-600'
    : isLight
    ? 'bg-slate-50 border-slate-200 text-slate-600'
    : 'bg-slate-900/90 border-slate-800 text-slate-400';
  const activeTabCls = isPaper
    ? 'bg-amber-600 text-white shadow-xs font-semibold'
    : 'bg-emerald-500 text-slate-950 shadow-xs font-semibold';

  // ─── Acciones ──────────────────────────────────────────────────
  const handleCreateOrder = () => {
    const name = newClientName.trim() || 'Cliente';
    const batchId =
      selectedBatchFilter !== 'todos' && selectedBatchFilter !== 'sin_grupo'
        ? selectedBatchFilter
        : null;
    const id = createOrder(name, batchId);
    setActiveOrderId(id);
    setNewClientName('');
    setShowNewOrderInput(false);
  };

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) return;
    const batchId = createOrderBatch(newBatchName);
    setNewBatchName('');
    setShowNewBatchInput(false);
    setSelectedBatchFilter(batchId);
    setShowBatchDetails(true);
  };

  const handleSelectBatch = (batchId: string) => {
    setActiveBatchId(batchId);
    setActiveOrderId(null);
    setShowBatchDetails(true);
  };

  const handleDeleteBatch = () => {
    const batch = orderBatches.find((item) => item.id === activeBatchId);
    if (!batch) return;
    if (confirm(`¿Eliminar "${batch.name}" y todos los pedidos de sus clientes? Esta acción no se puede deshacer.`)) {
      deleteOrderBatch(batch.id);
      setActiveOrderId(null);
      setShowBatchDetails(false);
      setSelectedBatchFilter('todos');
    }
  };

  const handleNewNote = () => {
    const id = createNote('General');
    setActiveNoteId(id);
    setNoteTab('editor');
  };

  // Pedidos visibles según el filtro seleccionado (incluyendo pedidos agrupados)
  const visibleOrders = orders.filter((order) => {
    if (selectedBatchFilter === 'sin_grupo') return !order.batchId;
    if (selectedBatchFilter !== 'todos') return order.batchId === selectedBatchFilter;
    return true;
  });

  const selectedBatchObj = orderBatches.find((b) => b.id === selectedBatchFilter);

  return (
    <div className={`min-h-screen w-full flex flex-col justify-center items-center ${bgOuter} transition-colors`}>
      {/* ── Contenedor Móvil ── */}
      <div className={`w-full max-w-md min-h-screen sm:min-h-[840px] sm:max-h-[92vh] sm:rounded-3xl sm:shadow-xl sm:border flex flex-col overflow-hidden relative ${containerCls}`}>

        {/* ══════════════════════════════════════════════════
            CABECERA LIMPIA Y LIGERA
        ══════════════════════════════════════════════════ */}
        <header className={`flex-shrink-0 px-3 py-2 flex items-center justify-between border-b ${isPaper ? 'bg-[#faf6ee] border-stone-200' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <ClipboardList className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h1 className={`text-sm font-bold tracking-tight leading-none ${isPaper ? 'text-stone-900' : 'text-white'}`}>
                Cuaderno de Pedidos
              </h1>
              <span className={`text-[10px] font-medium flex items-center gap-1 ${isPaper ? 'text-stone-400' : 'text-slate-500'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Local · Offline
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Botón Catálogo de Precios */}
            <button
              onClick={() => setIsCatalogOpen(true)}
              title="Lista de Precios"
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all ${isPaper ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Precios</span>
            </button>
            {/* Botón Respaldo */}
            <button
              onClick={() => setIsBackupOpen(true)}
              title="Respaldo y configuración"
              className={`p-1.5 rounded-lg active:scale-95 transition-all ${isPaper ? 'bg-stone-100 hover:bg-stone-200 text-stone-600' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
            >
              <span className="text-sm">⚙️</span>
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════
            BARRA DE TABS PRINCIPAL
        ══════════════════════════════════════════════════ */}
        <nav className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 border-b ${tabBarCls}`}>
          {([
            { key: 'pedidos', icon: <ClipboardList className="w-3.5 h-3.5" />, label: 'Pedidos' },
            { key: 'grupos', icon: <Layers className="w-3.5 h-3.5" />, label: 'Grupos' },
            { key: 'notas', icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Notas' },
            { key: 'calculadora', icon: <CalcIcon className="w-3.5 h-3.5" />, label: 'Calcular' },
          ] as { key: MainTab; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${mainTab === key ? activeTabCls : 'hover:opacity-80'}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* ══════════════════════════════════════════════════
            TAB 1: PEDIDOS (INTEGRA PEDIDOS AGRUPADOS)
        ══════════════════════════════════════════════════ */}
        {mainTab === 'pedidos' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Filtro superior de grupos en la pestaña de pedidos */}
            <div className={`flex-shrink-0 border-b px-2 py-1 flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] ${isPaper ? 'bg-[#f7f3ea] border-stone-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <button
                onClick={() => setSelectedBatchFilter('todos')}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-all ${
                  selectedBatchFilter === 'todos'
                    ? isPaper
                      ? 'bg-stone-700 text-white'
                      : 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
                }`}
              >
                Todos ({orders.length})
              </button>

              <button
                onClick={() => setSelectedBatchFilter('sin_grupo')}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-all ${
                  selectedBatchFilter === 'sin_grupo'
                    ? isPaper
                      ? 'bg-stone-700 text-white'
                      : 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
                }`}
              >
                Sin grupo ({orders.filter((o) => !o.batchId).length})
              </button>

              {orderBatches.map((batch) => {
                const count = orders.filter((o) => o.batchId === batch.id).length;
                return (
                  <button
                    key={batch.id}
                    onClick={() => setSelectedBatchFilter(batch.id)}
                    className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                      selectedBatchFilter === batch.id
                        ? isPaper
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-stone-600 hover:text-stone-900 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-3 h-3 opacity-70" />
                    <span>{batch.name}</span>
                    <span className="opacity-75 text-[10px]">({count})</span>
                  </button>
                );
              })}

              {/* Botón rápido para nuevo grupo desde la vista de pedidos */}
              {showNewBatchInput ? (
                <div className="flex items-center gap-1 pl-1">
                  <input
                    type="text"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateBatch()}
                    placeholder="Nuevo grupo..."
                    autoFocus
                    className="w-24 text-[11px] px-1.5 py-0.5 rounded border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <button onClick={handleCreateBatch} className="text-amber-600 font-bold px-1">✓</button>
                  <button onClick={() => setShowNewBatchInput(false)} className="text-rose-500 px-1">✕</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewBatchInput(true)}
                  className="px-2 py-0.5 rounded-md text-[10px] text-amber-700 dark:text-amber-400 font-semibold hover:underline whitespace-nowrap"
                >
                  + Grupo
                </button>
              )}
            </div>

            {/* Resumen del grupo si hay uno seleccionado */}
            {selectedBatchObj && (
              <div className={`flex-shrink-0 px-3 py-1.5 border-b flex items-center justify-between text-xs ${isPaper ? 'bg-amber-50/70 border-amber-200/60 text-stone-700' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold truncate text-amber-800 dark:text-amber-300">
                    📦 {selectedBatchObj.name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400">
                    · {visibleOrders.length} clientes · Total:{' '}
                    <strong className="font-mono text-stone-800 dark:text-slate-100">
                      {settings.currencySymbol}
                      {formatNumber(
                        visibleOrders.reduce((sum, o) => sum + calculateOrderTotals(o).total, 0)
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Selector horizontal de clientes / pedidos */}
            <div className={`flex-shrink-0 border-b ${isPaper ? 'bg-[#faf6ee] border-stone-200' : 'bg-slate-900 border-slate-800'} flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-none`}>
              {showNewOrderInput ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateOrder()}
                    placeholder="Nombre del cliente..."
                    autoFocus
                    className={`w-36 text-xs px-2 py-1 rounded-lg border focus:outline-none ${isPaper ? 'bg-white border-stone-300' : 'bg-slate-800 border-slate-700 text-white'}`}
                  />
                  <button onClick={handleCreateOrder} className="px-2 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold active:scale-95">✓</button>
                  <button onClick={() => setShowNewOrderInput(false)} className="p-1 text-rose-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewOrderInput(true)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border active:scale-95 transition-all ${isPaper ? 'bg-amber-600 text-white border-amber-700 shadow-xs' : 'bg-emerald-500 text-slate-950 border-emerald-600'}`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Cliente</span>
                </button>
              )}

              {visibleOrders.length === 0 ? (
                <span className="text-[11px] text-stone-400 dark:text-slate-500 px-2 py-1">
                  Sin pedidos en este filtro. Toca "+ Cliente".
                </span>
              ) : (
                visibleOrders.map((order) => {
                  const tot = calculateOrderTotals(order);
                  const isActive = order.id === activeOrderId;
                  const orderBatch = orderBatches.find((b) => b.id === order.batchId);

                  return (
                    <button
                      key={order.id}
                      onClick={() => setActiveOrderId(order.id)}
                      className={`flex-shrink-0 flex flex-col items-start px-2.5 py-1 rounded-xl border text-left text-xs transition-all active:scale-95 ${
                        isActive
                          ? isPaper
                            ? 'bg-stone-800 text-white border-stone-900 shadow-xs'
                            : 'bg-emerald-500 text-slate-950 border-emerald-600 font-bold'
                          : isPaper
                          ? 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
                          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="font-semibold truncate max-w-[90px]">
                          {order.clientName.split(' ')[0]}
                        </span>
                        {selectedBatchFilter === 'todos' && orderBatch && (
                          <span className={`text-[9px] px-1 rounded ${isActive ? 'bg-stone-700 text-amber-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                            {orderBatch.name.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono ${isActive ? 'opacity-85' : isPaper ? 'text-amber-700' : 'text-emerald-400'}`}>
                        {settings.currencySymbol}{formatNumber(tot.balance)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <OrderSheet
                onBackToList={() => setActiveOrderId(null)}
                onOpenProductCatalog={() => setIsCatalogOpen(true)}
              />
            </div>
          </div>
        )}

        {/* Grupos de pedidos y los pedidos de cada cliente */}
        {mainTab === 'grupos' && (
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
            {!showBatchDetails ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className={`font-bold text-sm ${isPaper ? 'text-stone-900' : 'text-white'}`}>
                      Pedidos agrupados
                    </h2>
                    <p className={`text-[11px] ${isPaper ? 'text-stone-500' : 'text-slate-400'}`}>
                      Abre un grupo para ver y administrar sus clientes.
                    </p>
                  </div>
                  {showNewBatchInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={newBatchName}
                        onChange={(event) => setNewBatchName(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && handleCreateBatch()}
                        placeholder="Ej. Pedido 24"
                        aria-label="Nombre del grupo de pedidos"
                        autoFocus
                        className={`w-28 min-h-11 px-2 rounded-lg border text-xs focus:outline-none ${isPaper ? 'bg-white border-stone-300' : 'bg-slate-800 border-slate-700 text-white'}`}
                      />
                      <button
                        onClick={handleCreateBatch}
                        disabled={!newBatchName.trim()}
                        className="min-h-11 px-2.5 rounded-lg bg-amber-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => setShowNewBatchInput(false)}
                        aria-label="Cancelar creación de grupo"
                        className="min-h-11 px-2 text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewBatchInput(true)}
                      className={`min-h-11 flex-shrink-0 px-3 rounded-xl text-xs font-bold border active:scale-95 ${isPaper ? 'bg-amber-600 text-white border-amber-700' : 'bg-emerald-500 text-slate-950 border-emerald-600'}`}
                    >
                      + Nuevo grupo
                    </button>
                  )}
                </div>
                {orderBatches.length === 0 ? (
                  <div className={`rounded-xl border p-6 text-center ${isPaper ? 'border-stone-300 bg-white text-stone-500' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-60" />
                    <p className="text-xs">Todavía no tienes grupos de pedidos.</p>
                    <p className="text-[11px] mt-1">Crea uno para reunir los pedidos de varios clientes.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orderBatches.map((batch) => {
                      const batchOrders = orders.filter((order) => order.batchId === batch.id);
                      const total = batchOrders.reduce(
                        (sum, order) => sum + calculateOrderTotals(order).total,
                        0
                      );
                      const paidCount = batchOrders.filter((order) => order.status === 'pagado').length;
                      return (
                        <button
                          key={batch.id}
                          onClick={() => handleSelectBatch(batch.id)}
                          className={`w-full min-h-16 flex items-center justify-between gap-3 rounded-xl border p-3 text-left active:scale-[0.99] ${isPaper ? 'bg-white border-stone-300 hover:bg-amber-50' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}
                        >
                          <span className="min-w-0">
                            <span className={`block truncate text-sm font-bold ${isPaper ? 'text-stone-900' : 'text-white'}`}>
                              {batch.name}
                            </span>
                            <span className={`block text-[11px] ${isPaper ? 'text-stone-500' : 'text-slate-400'}`}>
                              {batchOrders.length} clientes · {paidCount} pagados
                            </span>
                          </span>
                          <span className={`flex-shrink-0 text-xs font-mono font-bold ${isPaper ? 'text-amber-800' : 'text-emerald-400'}`}>
                            {settings.currencySymbol}{formatNumber(total)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              (() => {
                const batch = orderBatches.find((item) => item.id === activeBatchId);
                if (!batch) {
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBatchDetails(false)}
                        aria-label="Volver a grupos"
                        className="min-h-11 min-w-11 rounded-lg"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <p className="text-xs">Este grupo ya no existe.</p>
                    </div>
                  );
                }
                const batchOrders = orders.filter((order) => order.batchId === batch.id);
                const batchTotal = batchOrders.reduce(
                  (sum, order) => sum + calculateOrderTotals(order).total,
                  0
                );
                const allClientsPaid =
                  batchOrders.length > 0 && batchOrders.every((order) => order.status === 'pagado');
                const activeBatchOrder = batchOrders.find((order) => order.id === activeOrderId);

                return activeBatchOrder ? (
                  <div className="flex-1 min-h-0 -m-3 flex flex-col overflow-hidden">
                    <OrderSheet
                      onBackToList={() => setActiveOrderId(null)}
                      onOpenProductCatalog={() => setIsCatalogOpen(true)}
                    />
                  </div>
                ) : (
                  <>
                    <header className={`flex items-center gap-2 border-b pb-3 ${isPaper ? 'border-stone-300' : 'border-slate-800'}`}>
                      <button
                        onClick={() => {
                          setActiveOrderId(null);
                          setShowBatchDetails(false);
                        }}
                        aria-label="Volver a grupos"
                        className={`min-h-11 min-w-11 rounded-lg flex items-center justify-center ${isPaper ? 'bg-white text-stone-700' : 'bg-slate-800 text-slate-200'}`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h2 className={`truncate text-sm font-bold ${isPaper ? 'text-stone-900' : 'text-white'}`}>{batch.name}</h2>
                        <p className={`text-[11px] ${isPaper ? 'text-stone-500' : 'text-slate-400'}`}>
                          {batchOrders.length} clientes · Total {settings.currencySymbol}{formatNumber(batchTotal)}
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteBatch}
                        title="Eliminar grupo y sus pedidos"
                        aria-label="Eliminar grupo y sus pedidos"
                        className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </header>

                    {allClientsPaid && (
                      <section className={`rounded-xl border p-3 space-y-2 ${isPaper ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/40 border-emerald-800'}`}>
                        <p className={`text-xs font-bold flex items-center gap-1.5 ${isPaper ? 'text-emerald-800' : 'text-emerald-300'}`}>
                          <CheckCircle2 className="w-4 h-4" />
                          Todos los clientes pagaron
                        </p>
                        <p className={`text-[11px] ${isPaper ? 'text-emerald-700' : 'text-emerald-200/80'}`}>
                          Puedes eliminar este grupo ahora o conservarlo y borrarlo cuando quieras.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleDeleteBatch}
                            className="min-h-11 flex-1 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white"
                          >
                            Eliminar grupo
                          </button>
                          <button
                            onClick={() => setShowBatchDetails(false)}
                            className={`min-h-11 flex-1 rounded-lg border px-3 text-xs font-bold ${isPaper ? 'bg-white border-emerald-300 text-emerald-800' : 'bg-slate-900 border-emerald-800 text-emerald-200'}`}
                          >
                            Conservar por ahora
                          </button>
                        </div>
                      </section>
                    )}

                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${isPaper ? 'text-stone-500' : 'text-slate-400'}`} />
                      <h3 className={`text-xs font-bold ${isPaper ? 'text-stone-700' : 'text-slate-200'}`}>Clientes del grupo</h3>
                      <button
                        onClick={() => setShowNewBatchClientInput((visible) => !visible)}
                        className={`ml-auto min-h-11 rounded-lg px-3 text-xs font-bold ${isPaper ? 'bg-amber-600 text-white' : 'bg-emerald-500 text-slate-950'}`}
                      >
                        + Agregar cliente
                      </button>
                    </div>
                    {showNewBatchClientInput && (
                      <form
                        className={`flex items-center gap-1.5 rounded-xl border p-2 ${isPaper ? 'bg-white border-stone-300' : 'bg-slate-900 border-slate-800'}`}
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!newClientName.trim()) return;
                          const id = createOrder(newClientName, batch.id);
                          setActiveOrderId(id);
                          setNewClientName('');
                          setShowNewBatchClientInput(false);
                        }}
                      >
                        <input
                          value={newClientName}
                          onChange={(event) => setNewClientName(event.target.value)}
                          placeholder="Nombre del cliente"
                          aria-label="Nombre del cliente"
                          autoFocus
                          className={`min-h-11 min-w-0 flex-1 rounded-lg border px-2 text-xs focus:outline-none ${isPaper ? 'border-stone-300 bg-white' : 'border-slate-700 bg-slate-800 text-white'}`}
                        />
                        <button
                          type="submit"
                          disabled={!newClientName.trim()}
                          className="min-h-11 rounded-lg bg-amber-600 px-3 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Crear
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewBatchClientInput(false)}
                          aria-label="Cancelar"
                          className="min-h-11 min-w-11 text-rose-500"
                        >
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                      </form>
                    )}
                    {batchOrders.length === 0 ? (
                      <div className={`rounded-xl border p-5 text-center text-xs ${isPaper ? 'border-stone-300 bg-white text-stone-500' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                        Este grupo todavía no tiene clientes. Usa “Agregar cliente” para comenzar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {batchOrders.map((order) => {
                          const totals = calculateOrderTotals(order);
                          return (
                            <button
                              key={order.id}
                              onClick={() => setActiveOrderId(order.id)}
                              className={`w-full min-h-16 flex items-center justify-between gap-3 rounded-xl border p-3 text-left ${isPaper ? 'bg-white border-stone-300' : 'bg-slate-900 border-slate-800'}`}
                            >
                              <span className="min-w-0">
                                <span className={`block truncate text-xs font-bold ${isPaper ? 'text-stone-900' : 'text-white'}`}>
                                  {order.clientName}
                                </span>
                                <span className={`block text-[11px] ${isPaper ? 'text-stone-500' : 'text-slate-400'}`}>
                                  {totals.itemsCount} productos · {order.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                                </span>
                              </span>
                              <span className={`flex-shrink-0 text-xs font-mono font-bold ${order.status === 'pagado' ? 'text-emerald-500' : isPaper ? 'text-amber-800' : 'text-emerald-400'}`}>
                                {settings.currencySymbol}{formatNumber(totals.total)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2: NOTAS LIBRES
        ══════════════════════════════════════════════════ */}
        {mainTab === 'notas' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <div className={`px-2 py-1 flex items-center justify-between border-b text-xs ${tabBarCls}`}>
              <div className="flex items-center gap-1">
                {(['lista', 'editor'] as NoteTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNoteTab(t)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all capitalize ${noteTab === t ? (isPaper ? 'bg-stone-700 text-white' : 'bg-slate-700 text-white') : 'opacity-60 hover:opacity-90'}`}
                  >
                    {t === 'lista' ? 'Mis Notas' : 'Editor'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNewNote}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold active:scale-95 ${isPaper ? 'bg-amber-600 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}
              >
                <FilePlus className="w-3.5 h-3.5" />
                Nueva
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {noteTab === 'lista'
                ? <NoteList onSelectNote={() => setNoteTab('editor')} />
                : <NoteEditor onBackToList={() => setNoteTab('lista')} />
              }
            </div>
            {/* FAB calculadora ligero y accesible */}
            <button
              onClick={() => toggleDrawer(true)}
              title="Calculadora rápida"
              className="absolute bottom-4 right-4 w-11 h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center justify-center active:scale-95 z-20"
            >
              <CalcIcon className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 3: CALCULADORA COMPLETA
        ══════════════════════════════════════════════════ */}
        {mainTab === 'calculadora' && (
          <div className="flex-1 flex flex-col justify-end min-h-0 overflow-y-auto">
            <Calculator compact={false} />
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            DRAWER CALCULADORA (desde notas)
        ══════════════════════════════════════════════════ */}
        {isDrawerOpen && mainTab !== 'calculadora' && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end justify-center">
            <div className="w-full max-w-md bg-slate-900 border-t border-slate-700 rounded-t-3xl overflow-hidden shadow-2xl">
              <div className="p-2 border-b border-slate-800 flex items-center justify-between px-4">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CalcIcon className="w-4 h-4 text-emerald-400" />
                  Calculadora Rápida
                </span>
                <button onClick={() => toggleDrawer(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Calculator compact={true} />
            </div>
          </div>
        )}

        {/* Modales globales */}
        <CalcHistoryModal />
        <BackupModal isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
        <ProductCatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />
      </div>
    </div>
  );
}

export default App;
