import { useState } from 'react';
import { BookOpen, Calculator as CalcIcon, ClipboardList } from 'lucide-react';
import { useCalculatorStore } from './store/useCalculatorStore';
import { useNotesStore } from './store/useNotesStore';
import { useOrdersStore } from './store/useOrdersStore';
import { OrdersView } from './components/OrdersView';
import { OrderSheet } from './components/OrderSheet';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { Calculator } from './components/Calculator';
import { CalcHistoryModal } from './components/CalcHistoryModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { SettingsModal } from './components/SettingsModal';
import { PageHeader, Sheet } from './components/ui';

type Tab = 'pedidos' | 'notas' | 'calculadora';

const TABS: { key: Tab; label: string; Icon: typeof BookOpen }[] = [
  { key: 'pedidos', label: 'Pedidos', Icon: ClipboardList },
  { key: 'notas', label: 'Notas', Icon: BookOpen },
  { key: 'calculadora', label: 'Calcular', Icon: CalcIcon },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('pedidos');
  const [pricesOpen, setPricesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeOrderId = useOrdersStore((s) => s.activeOrderId);
  const orderExists = useOrdersStore((s) => s.orders.some((o) => o.id === s.activeOrderId));
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const noteExists = useNotesStore((s) => s.notes.some((n) => n.id === s.activeNoteId));
  const { isDrawerOpen, toggleDrawer } = useCalculatorStore();

  return (
    <div className="flex h-dvh w-full justify-center">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-paper sm:shadow-2xl">
        <main className="flex min-h-0 flex-1 flex-col">
          {tab === 'pedidos' &&
            (activeOrderId && orderExists ? (
              <OrderSheet onOpenPrices={() => setPricesOpen(true)} />
            ) : (
              <OrdersView onOpenPrices={() => setPricesOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />
            ))}

          {tab === 'notas' &&
            (activeNoteId && noteExists ? <NoteEditor /> : <NoteList onOpenSettings={() => setSettingsOpen(true)} />)}

          {tab === 'calculadora' && (
            <>
              <PageHeader title="Calculadora" />
              <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto">
                <Calculator />
              </div>
            </>
          )}
        </main>

        <nav className="pb-safe flex flex-shrink-0 border-t-2 border-ink/80 bg-paper-2" aria-label="Secciones del cuaderno">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={tab === key ? 'page' : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                tab === key ? 'text-pen' : 'text-pencil'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>

        {isDrawerOpen && (
          <Sheet title="Calculadora" onClose={() => toggleDrawer(false)}>
            <Calculator compact />
          </Sheet>
        )}
        <CalcHistoryModal />
        {pricesOpen && <ProductCatalogModal onClose={() => setPricesOpen(false)} />}
        {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      </div>
    </div>
  );
}

