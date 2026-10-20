import { useMemo, useState } from 'react';
import { Check, Delete } from 'lucide-react';
import { useOrdersStore } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { formatNumber, roundToPrecision } from '../utils/mathEngine';
import { playKeyClick, playActionSuccess, triggerHaptic } from '../utils/sound';
import { Sheet, Btn } from './ui';

interface Props {
  orderId: string;
  onClose: () => void;
  onOpenPrices: () => void;
}

const CUSTOM = '__custom__';
const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

/** Pesar un producto: el subtotal se actualiza con cada dígito. */
export function WeighSheet({ orderId, onClose, onOpenPrices }: Props) {
  const { products, addItemToOrder } = useOrdersStore();
  const { currencySymbol: money, hapticSound } = useCalculatorStore((s) => s.settings);

  const [pickedId, setPickedId] = useState<string>(products[0]?.id ?? CUSTOM);
  const [weight, setWeight] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const isCustom = pickedId === CUSTOM || !products.some((p) => p.id === pickedId);
  const product = isCustom ? null : products.find((p) => p.id === pickedId) ?? null;
  const unit = product?.unit ?? 'kg';
  const price = product ? product.price : Number(customPrice) || 0;
  const qty = parseFloat(weight) || 0;
  const subtotal = useMemo(() => roundToPrecision(qty * price, 2), [qty, price]);
  const canAdd = subtotal > 0 && (!isCustom || customName.trim().length > 0);

  const press = (k: string) => {
    playKeyClick(hapticSound);
    triggerHaptic(8);
    setWeight((w) => {
      if (k === 'DEL') return w.slice(0, -1);
      if (k === '.') return w.includes('.') ? w : (w || '0') + '.';
      return w + k;
    });
  };

  const add = () => {
    if (!canAdd) return;
    playActionSuccess(hapticSound);
    triggerHaptic(20);
    addItemToOrder(orderId, {
      productId: product?.id,
      productName: product ? product.name : customName.trim(),
      pricePerUnit: price,
      weightOrQty: qty,
      unit,
    });
    onClose();
  };

  const pick = (active: boolean) =>
    `min-h-11 flex-shrink-0 rounded-lg border px-3 py-1 text-left text-xs ${
      active ? 'border-pen bg-pen text-white' : 'border-ink/30 bg-paper'
    }`;

  return (
    <Sheet title="Pesar producto" onClose={onClose}>
      <div className="space-y-3 p-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {products.map((p) => (
            <button key={p.id} onClick={() => setPickedId(p.id)} className={pick(!isCustom && pickedId === p.id)}>
              <span className="block max-w-32 truncate font-semibold">{p.name}</span>
              <span className="block font-mono opacity-80">
                {money}
                {formatNumber(p.price)}/{p.unit}
              </span>
            </button>
          ))}
          <button onClick={() => setPickedId(CUSTOM)} className={pick(isCustom)}>
            <span className="block font-semibold">Otro</span>
            <span className="block opacity-80">sin lista</span>
          </button>
        </div>
        <button onClick={onOpenPrices} className="text-xs font-semibold text-pen underline">
          Editar lista de precios
        </button>

        {isCustom && (
          <div className="grid grid-cols-2 gap-2">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Producto"
              aria-label="Nombre del producto"
              className="min-h-11 border-b-2 border-ink/40 bg-transparent px-1"
            />
            <input
              type="number"
              inputMode="decimal"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Precio por kg"
              aria-label="Precio por kg"
              className="min-h-11 border-b-2 border-ink/40 bg-transparent px-1 font-mono"
            />
          </div>
        )}

        {/* Lectura en vivo: peso × precio = subtotal */}
        <div className="rounded-lg border-2 border-ink/80 bg-paper-2 p-3">
          <div className="flex items-baseline justify-between text-xs text-pencil">
            <span className="truncate">{product?.name ?? (customName || 'Producto')}</span>
            <span className="font-mono">
              {money}
              {formatNumber(price)}/{unit}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-3xl font-bold tabular-nums">
              {(weight || '0').replace('.', ',')} <span className="text-base font-sans text-pencil">{unit}</span>
            </span>
            <span className="font-mono text-2xl font-black text-ok tabular-nums">
              {money}
              {formatNumber(subtotal)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {['0.5', '1', '1.5', '2'].map((v) => (
            <button
              key={v}
              onClick={() => {
                playKeyClick(hapticSound);
                setWeight(v);
              }}
              className="min-h-11 rounded-lg border border-ink/30 text-sm font-semibold active:bg-ink/10"
            >
              {v.replace('.', ',')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {NUMPAD.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              aria-label={k === 'DEL' ? 'Borrar' : k === '.' ? 'Coma decimal' : k}
              className="flex h-12 items-center justify-center rounded-lg border border-ink/20 bg-white/60 text-xl font-bold active:bg-ink/10"
            >
              {k === 'DEL' ? <Delete className="h-5 w-5" /> : k === '.' ? ',' : k}
            </button>
          ))}
        </div>

        <Btn onClick={add} disabled={!canAdd} className="w-full !bg-ok text-base">
          <Check className="h-5 w-5" /> Sumar al pedido ({money}
          {formatNumber(subtotal)})
        </Btn>
      </div>
    </Sheet>
  );
}
