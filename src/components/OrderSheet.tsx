import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Plus, Share2, Trash2, X } from 'lucide-react';
import { useOrdersStore, calculateOrderTotals } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { formatNumber } from '../utils/mathEngine';
import { playKeyClick, triggerHaptic } from '../utils/sound';
import { IconBtn } from './ui';
import { WeighSheet } from './WeighSheet';

interface Props {
  onOpenPrices: () => void;
}

/** Hoja de un cliente: renglones pesados y saldo siempre visible al pie. */
export function OrderSheet({ onOpenPrices }: Props) {
  const { orders, activeOrderId, orderBatches, setActiveOrderId, setOrderBatch, updateOrder, deleteOrder, removeItemFromOrder } =
    useOrdersStore();
  const { currencySymbol: money, hapticSound } = useCalculatorStore((s) => s.settings);

  const order = orders.find((o) => o.id === activeOrderId);
  const totals = useMemo(() => (order ? calculateOrderTotals(order) : null), [order]);

  const [weighing, setWeighing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!order || !totals) return null;
  const batch = orderBatches.find((b) => b.id === order.batchId);
  const paid = order.status === 'pagado';

  const saveClient = () => {
    if (nameInput.trim()) updateOrder(order.id, { clientName: nameInput.trim(), clientPhone: phoneInput.trim() });
    setEditing(false);
  };

  const share = async () => {
    const lines = [
      `*${order.clientName}*${batch ? ` · ${batch.name}` : ''}`,
      new Date(order.date).toLocaleDateString('es-CO'),
      '',
      ...order.items.map(
        (i) => `• ${i.productName}: ${i.weightOrQty} ${i.unit} × ${money}${formatNumber(i.pricePerUnit)} = ${money}${formatNumber(i.subtotal)}`
      ),
      '',
      order.discount > 0 ? `Descuento: -${money}${formatNumber(order.discount)}` : '',
      `*Total: ${money}${formatNumber(totals.total)}*`,
      order.deposit > 0 ? `Abono: ${money}${formatNumber(order.deposit)}` : '',
      order.deposit > 0 ? `*Saldo: ${money}${formatNumber(totals.balance)}*` : '',
      order.notes ? `\nNota: ${order.notes}` : '',
    ]
      .filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0))
      .join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      triggerHaptic(15);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sin portapapeles disponible */
    }
  };

  const moneyInput = (label: string, key: 'discount' | 'deposit') => (
    <label className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-ink/20 px-2 text-xs text-pencil">
      {label}
      <span className="flex items-center font-mono text-sm font-bold text-ink">
        {money}
        <input
          type="number"
          inputMode="decimal"
          value={order[key] || ''}
          onChange={(e) => updateOrder(order.id, { [key]: Math.max(0, parseFloat(e.target.value) || 0) })}
          placeholder="0"
          className="w-20 bg-transparent text-right"
        />
      </span>
    </label>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="pt-safe flex flex-shrink-0 items-center gap-1 border-b-2 border-ink/80 bg-paper px-2 pb-1">
        <IconBtn label="Volver al índice" onClick={() => setActiveOrderId(null)}>
          <ArrowLeft className="h-5 w-5" />
        </IconBtn>
        {editing ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              saveClient();
            }}
          >
            <div className="min-w-0 flex-1">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                aria-label="Nombre del cliente"
                className="w-full border-b border-pen bg-transparent font-serif text-lg font-bold"
              />
              <input
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                inputMode="tel"
                placeholder="Teléfono (opcional)"
                aria-label="Teléfono"
                className="w-full bg-transparent text-xs"
              />
            </div>
            <IconBtn label="Guardar" onClick={saveClient}>
              <Check className="h-5 w-5 text-ok" />
            </IconBtn>
            <IconBtn label="Cancelar" onClick={() => setEditing(false)}>
              <X className="h-5 w-5" />
            </IconBtn>
          </form>
        ) : (
          <button
            onClick={() => {
              setNameInput(order.clientName);
              setPhoneInput(order.clientPhone || '');
              setEditing(true);
            }}
            aria-label="Editar nombre y teléfono"
            className="min-h-11 min-w-0 flex-1 px-1 text-left"
          >
            <span className="block truncate font-serif text-xl leading-6 font-bold">{order.clientName}</span>
            {order.clientPhone && <span className="block truncate text-xs text-pencil">{order.clientPhone}</span>}
          </button>
        )}
        {!editing && (
          <>
            <IconBtn label="Copiar resumen para WhatsApp" onClick={share}>
              {copied ? <Check className="h-5 w-5 text-ok" /> : <Share2 className="h-5 w-5" />}
            </IconBtn>
            <IconBtn
              label="Eliminar pedido"
              danger
              onClick={() => {
                if (confirm('¿Eliminar esta hoja del cuaderno?')) deleteOrder(order.id);
              }}
            >
              <Trash2 className="h-5 w-5" />
            </IconBtn>
          </>
        )}
      </header>

      <div className="flex flex-shrink-0 items-center gap-2 border-b border-rule px-3 py-1">
        <select
          value={order.batchId || ''}
          onChange={(e) => setOrderBatch(order.id, e.target.value || null)}
          aria-label="Grupo de entrega"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-ink/30 bg-paper px-2 text-sm"
        >
          <option value="">Sin grupo</option>
          {orderBatches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            playKeyClick(hapticSound);
            updateOrder(order.id, { status: paid ? 'pendiente' : 'pagado' });
          }}
          className={`min-h-11 flex-shrink-0 rounded-lg border-2 px-3 text-xs font-black tracking-wide ${
            paid ? 'border-ok bg-ok text-white' : 'border-alert text-alert'
          }`}
        >
          {paid ? '✓ PAGADO' : 'PENDIENTE'}
        </button>
      </div>

      {/* Renglones del pedido */}
      <div className="page min-h-0 flex-1 overflow-y-auto pr-3 pl-10">
        {order.items.map((i) => (
          <div key={i.id} className="flex items-start gap-1" style={{ minHeight: 'calc(var(--line) * 2)' }}>
            <div className="min-w-0 flex-1">
              <p className="rule-line truncate font-serif text-base font-semibold">{i.productName}</p>
              <p className="rule-line truncate font-mono text-xs text-pencil">
                {i.weightOrQty.toString().replace('.', ',')} {i.unit} × {money}
                {formatNumber(i.pricePerUnit)}
              </p>
            </div>
            <p className="rule-line font-mono text-base font-bold tabular-nums">
              {money}
              {formatNumber(i.subtotal)}
            </p>
            <button
              aria-label={`Quitar ${i.productName}`}
              onClick={() => {
                removeItemFromOrder(order.id, i.id);
                triggerHaptic(5);
              }}
              className="-mt-2 flex min-h-11 min-w-9 items-center justify-center text-ink/40 active:text-alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            playKeyClick(hapticSound);
            setWeighing(true);
          }}
          className="flex min-h-14 w-full items-center gap-2 text-left font-serif text-lg font-semibold text-pen"
        >
          <Plus className="h-5 w-5" /> {order.items.length ? 'Pesar otro producto' : 'Pesar primer producto'}
        </button>

        <input
          value={order.notes}
          onChange={(e) => updateOrder(order.id, { notes: e.target.value })}
          placeholder="Nota de entrega…"
          aria-label="Nota de entrega"
          className="rule-line mb-4 w-full bg-transparent text-sm italic placeholder:text-pencil/70"
        />
      </div>

      {/* Pie de cuenta: saldo siempre visible */}
      <div className="flex-shrink-0 space-y-1.5 border-t-2 border-ink/80 bg-paper px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          {moneyInput('Descuento', 'discount')}
          {moneyInput('Abono', 'deposit')}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-xs text-pencil">
            Total {money}
            {formatNumber(totals.total)}
          </span>
          <span className="text-right">
            <span className="block text-[11px] font-bold tracking-wide text-pencil uppercase">Saldo a cobrar</span>
            <span className={`font-mono text-2xl leading-7 font-black tabular-nums ${paid ? 'text-ok' : ''}`}>
              {money}
              {formatNumber(totals.balance)}
            </span>
          </span>
        </div>
      </div>

      {weighing && (
        <WeighSheet orderId={order.id} onClose={() => setWeighing(false)} onOpenPrices={onOpenPrices} />
      )}
    </div>
  );
}
