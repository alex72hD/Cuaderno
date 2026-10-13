import React, { useState } from 'react';
import {
  BookOpen,
  Calculator as CalcIcon,
  ClipboardList,
  Package,
  X,
  FilePlus,
  UserPlus,
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
type MainTab = 'pedidos' | 'notas' | 'calculadora';
// Sub-tab dentro de notas
type NoteTab = 'editor' | 'lista';

export function App() {
  const { isDrawerOpen, toggleDrawer, settings } = useCalculatorStore();
  const { createNote, setActiveNoteId } = useNotesStore();
  const { orders, createOrder, setActiveOrderId, activeOrderId } = useOrdersStore();

  const [mainTab, setMainTab] = useState<MainTab>('pedidos');
  const [noteTab, setNoteTab] = useState<NoteTab>('lista');
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [showNewOrderInput, setShowNewOrderInput] = useState(false);

  // ─── Tema Visual ───────────────────────────────────────────────
  const isPaper = settings.theme === 'paper';
  const isLight = settings.theme === 'light';
  const bgOuter = isPaper ? 'bg-[#e8dcc8]' : isLight ? 'bg-slate-200' : 'bg-slate-950';
  const containerCls = isPaper
    ? 'bg-[#faf7ef] text-stone-900 border-stone-300'
    : isLight
    ? 'bg-white text-slate-900 border-slate-200'
    : 'bg-[#0a0e1a] text-slate-100 border-slate-800';
  const tabBarCls = isPaper
    ? 'bg-[#f0e8d8] border-stone-300 text-stone-700'
    : isLight
    ? 'bg-slate-100 border-slate-200 text-slate-600'
    : 'bg-slate-900/90 border-slate-800 text-slate-400';
  const activeTabCls = isPaper
    ? 'bg-amber-700 text-white shadow-sm'
    : 'bg-emerald-500 text-slate-950 shadow-sm font-semibold';

  // ─── Acciones ──────────────────────────────────────────────────
  const handleCreateOrder = () => {
    const name = newClientName.trim() || 'Cliente';
    const id = createOrder(name);
    setActiveOrderId(id);
    setNewClientName('');
    setShowNewOrderInput(false);
  };

  const handleNewNote = () => {
    const id = createNote('General');
    setActiveNoteId(id);
    setNoteTab('editor');
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-center items-center ${bgOuter} transition-colors`}>
      {/* ── Contenedor Móvil ── */}
      <div className={`w-full max-w-md min-h-screen sm:min-h-[860px] sm:max-h-[92vh] sm:rounded-3xl sm:shadow-2xl sm:border flex flex-col overflow-hidden relative ${containerCls}`}>

        {/* ══════════════════════════════════════════════════
            CABECERA: Logo + Badge Offline + Botón Respaldo
        ══════════════════════════════════════════════════ */}
        <header className={`flex-shrink-0 px-3 py-2 flex items-center justify-between border-b ${isPaper ? 'bg-[#eee3cc] border-stone-300' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/30">
              <span className="text-lg select-none">📒</span>
            </div>
            <div>
              <h1 className={`text-sm font-black font-serif tracking-tight leading-none ${isPaper ? 'text-stone-900' : 'text-white'}`}>
                Cuaderno de Pedidos
              </h1>
              <span className={`text-[10px] font-medium flex items-center gap-1 ${isPaper ? 'text-stone-500' : 'text-slate-400'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                Local · Sin internet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botón Catálogo de Precios */}
            <button
              onClick={() => setIsCatalogOpen(true)}
              title="Lista de Precios"
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${isPaper ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Precios</span>
            </button>
            {/* Botón Respaldo */}
            <button
              onClick={() => setIsBackupOpen(true)}
              title="Respaldo y configuración"
              className={`p-1.5 rounded-lg active:scale-95 transition-all ${isPaper ? 'bg-stone-200 text-stone-600 hover:bg-stone-300' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <span className="text-base">⚙️</span>
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════
            BARRA DE TABS PRINCIPAL
        ══════════════════════════════════════════════════ */}
        <nav className={`flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border-b ${tabBarCls}`}>
          {([ 
            { key: 'pedidos', icon: <ClipboardList className="w-3.5 h-3.5" />, label: 'Pedidos' },
            { key: 'notas',   icon: <BookOpen className="w-3.5 h-3.5" />,      label: 'Notas' },
            { key: 'calculadora', icon: <CalcIcon className="w-3.5 h-3.5" />,  label: 'Calcular' },
          ] as { key: MainTab; icon: React.ReactNode; label: string }[]).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${mainTab === key ? activeTabCls : 'hover:opacity-80'}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* ══════════════════════════════════════════════════
            TAB 1: CUADERNO DE PEDIDOS (PANTALLA PRINCIPAL)
        ══════════════════════════════════════════════════ */}
        {mainTab === 'pedidos' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Lista lateral de clientes / pedidos activos */}
            <div className={`flex-shrink-0 border-b ${isPaper ? 'bg-[#f0e8d8] border-stone-300' : 'bg-slate-900 border-slate-800'} flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-none`}>
              {/* Botón Nuevo Pedido */}
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
                  <span>Nuevo</span>
                </button>
              )}

              {/* Chips de pedidos existentes */}
              {orders.map((order) => {
                const tot = calculateOrderTotals(order);
                const isActive = order.id === activeOrderId;
                return (
                  <button
                    key={order.id}
                    onClick={() => setActiveOrderId(order.id)}
                    className={`flex-shrink-0 flex flex-col items-start px-2.5 py-1.5 rounded-xl border text-left text-xs transition-all active:scale-95 ${
                      isActive
                        ? isPaper
                          ? 'bg-amber-700 text-white border-amber-800 shadow-xs'
                          : 'bg-emerald-500 text-slate-950 border-emerald-600 font-bold'
                        : isPaper
                        ? 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                        : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span className="font-semibold truncate max-w-[100px]">{order.clientName.split(' ')[0]}</span>
                    <span className={`text-[10px] font-mono ${isActive ? 'opacity-80' : isPaper ? 'text-amber-700' : 'text-emerald-400'}`}>
                      {settings.currencySymbol}{formatNumber(tot.balance)}
                    </span>

                  </button>
                );
              })}
            </div>

            {/* Hoja del Pedido Activo */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <OrderSheet
                onBackToList={() => {}}
                onOpenProductCatalog={() => setIsCatalogOpen(true)}
              />
            </div>
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
            {/* FAB calculadora */}
            <button
              onClick={() => toggleDrawer(true)}
              className="absolute bottom-5 right-5 w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 z-20"
            >
              <CalcIcon className="w-7 h-7 stroke-[2.2]" />
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
