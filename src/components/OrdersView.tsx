import { useState } from 'react';
import { Package, Plus, Settings, Trash2 } from 'lucide-react';
import { useOrdersStore, calculateOrderTotals } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { formatNumber } from '../utils/mathEngine';
import { PageHeader, IconBtn } from './ui';

interface Props {
  onOpenPrices: () => void;
  onOpenSettings: () => void;
}

type Adding = 'cliente' | 'grupo' | null;

export function OrdersView({ onOpenPrices, onOpenSettings }: Props) {
  const { orders, orderBatches, createOrder, createOrderBatch, deleteOrderBatch, setActiveOrderId } =
    useOrdersStore();
  const money = useCalculatorStore((s) => s.settings.currencySymbol);

  const [filter, setFilter] = useState<string>('todos'); // 'todos' | 'sin_grupo' | id de grupo
  const [adding, setAdding] = useState<Adding>(null);
  const [name, setName] = useState('');

  const batch = orderBatches.find((b) => b.id === filter);
  const activeFilter = filter === 'todos' || filter === 'sin_grupo' || batch ? filter : 'todos';

  const visible = orders.filter((o) =>
    activeFilter === 'todos' ? true : activeFilter === 'sin_grupo' ? !o.batchId : o.batchId === activeFilter
  );
  const pending = visible.reduce((sum, o) => {
    const t = calculateOrderTotals(o);
    return o.status === 'pagado' ? sum : sum + Math.max(0, t.balance);
  }, 0);

  const submit = () => {
    if (adding === 'cliente') {
      createOrder(name, batch?.id ?? null);
    } else if (adding === 'grupo' && name.trim()) {
      setFilter(createOrderBatch(name));
    }
    setName('');
    setAdding(null);
  };

  const chip = (active: boolean) =>
    `min-h-9 flex-shrink-0 rounded-full border px-3 text-xs font-semibold whitespace-nowrap ${
      active ? 'border-ink bg-ink text-paper' : 'border-ink/30 text-ink/80'
    }`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Pedidos">
        <button
          onClick={onOpenPrices}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-pen active:bg-ink/10"
        >
          <Package className="h-4 w-4" /> Precios
        </button>
        <IconBtn label="Ajustes y respaldo" onClick={onOpenSettings}>
          <Settings className="h-5 w-5" />
        </IconBtn>
      </PageHeader>

      {/* Grupos de entrega */}
      <div className="no-scrollbar flex flex-shrink-0 items-center gap-1.5 overflow-x-auto border-b border-rule px-3 py-1.5">
        <button onClick={() => setFilter('todos')} className={chip(activeFilter === 'todos')}>
          Todos ({orders.length})
        </button>
        {orderBatches.length > 0 && (
          <button onClick={() => setFilter('sin_grupo')} className={chip(activeFilter === 'sin_grupo')}>
            Sin grupo
          </button>
        )}
        {orderBatches.map((b) => (
          <button key={b.id} onClick={() => setFilter(b.id)} className={chip(activeFilter === b.id)}>
            {b.name}
          </button>
        ))}
        <button
          onClick={() => {
            setName('');
            setAdding('grupo');
          }}
          className="min-h-9 flex-shrink-0 px-2 text-xs font-semibold whitespace-nowrap text-pen"
        >
          + Grupo
        </button>
      </div>

      {batch && (
        <div className="flex flex-shrink-0 items-center gap-1 border-b border-rule bg-paper-2 pl-4 text-xs text-pencil">
          <span className="flex-1 truncate">
            {batch.name} · {visible.length} clientes · {visible.filter((o) => o.status === 'pagado').length}{' '}
            pagados
          </span>
          <IconBtn
            label="Eliminar grupo y sus pedidos"
            danger
            onClick={() => {
              if (confirm(`¿Eliminar "${batch.name}" y los pedidos de sus clientes? No se puede deshacer.`)) {
                deleteOrderBatch(batch.id);
                setFilter('todos');
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
      )}

      {/* Índice del cuaderno: una hoja por cliente */}
      <div className="page min-h-0 flex-1 overflow-y-auto pr-3 pl-10">
        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2 py-2"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={adding === 'cliente' ? 'Nombre del cliente' : 'Nombre del grupo (ej. Pedido 24)'}
              aria-label={adding === 'cliente' ? 'Nombre del cliente' : 'Nombre del grupo'}
              className="min-h-11 min-w-0 flex-1 border-b-2 border-pen bg-transparent font-serif text-lg"
            />
            <button type="submit" className="min-h-11 rounded-lg bg-pen px-3 text-sm font-semibold text-white">
              Crear
            </button>
            <button
              type="button"
              onClick={() => setAdding(null)}
              className="min-h-11 px-2 text-sm text-pencil"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button
            onClick={() => {
              setName('');
              setAdding('cliente');
            }}
            className="flex min-h-14 w-full items-center gap-2 text-left font-serif text-lg font-semibold text-pen"
          >
            <Plus className="h-5 w-5" /> Nueva hoja de cliente
          </button>
        )}

        {visible.length === 0 && !adding && (
          <p className="rule-line pt-2 text-sm text-pencil">Aún no hay hojas aquí.</p>
        )}

        {visible.map((o) => {
          const t = calculateOrderTotals(o);
          const group = orderBatches.find((b) => b.id === o.batchId);
          const paid = o.status === 'pagado';
          return (
            <button
              key={o.id}
              onClick={() => setActiveOrderId(o.id)}
              className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate font-serif text-lg leading-6 font-semibold">{o.clientName}</span>
                <span className="block truncate text-xs text-pencil">
                  {t.itemsCount} {t.itemsCount === 1 ? 'producto' : 'productos'}
                  {activeFilter === 'todos' && group ? ` · ${group.name}` : ''}
                </span>
              </span>
              <span
                className={`flex-shrink-0 text-right font-mono text-sm font-bold tabular-nums ${
                  paid ? 'text-ok' : ''
                }`}
              >
                {paid ? '✓ Pagado' : `${money}${formatNumber(t.balance)}`}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between border-t-2 border-ink/80 bg-paper px-4 py-2 text-sm">
          <span className="text-pencil">Por cobrar</span>
          <span className="font-mono text-lg font-black tabular-nums">
            {money}
            {formatNumber(pending)}
          </span>
        </div>
      )}
    </div>
  );
}
