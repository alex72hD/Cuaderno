import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useOrdersStore } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import type { UnitType } from '../types';
import { formatNumber } from '../utils/mathEngine';
import { playActionSuccess, triggerHaptic } from '../utils/sound';
import { Sheet } from './ui';

/** Lista de precios: los cambios no alteran pedidos ya guardados. */
export function ProductCatalogModal({ onClose }: { onClose: () => void }) {
  const { products, addProduct, updateProduct, deleteProduct } = useOrdersStore();
  const { currencySymbol: money, hapticSound } = useCalculatorStore((s) => s.settings);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<UnitType>('kg');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(price);
    if (!name.trim() || !(value > 0)) return;
    playActionSuccess(hapticSound);
    triggerHaptic(15);
    addProduct({ name: name.trim(), price: value, unit });
    setName('');
    setPrice('');
  };

  const savePrice = (id: string) => {
    const value = Number(editPrice);
    if (value > 0) updateProduct(id, { price: value });
    setEditingId(null);
  };

  return (
    <Sheet title="Lista de precios" onClose={onClose}>
      <form onSubmit={add} className="space-y-2 border-b border-rule p-3">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Producto (ej. Queso costeño)"
            aria-label="Nombre del producto"
            className="min-h-11 min-w-0 flex-1 border-b-2 border-ink/40 bg-transparent px-1"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitType)}
            aria-label="Unidad"
            className="min-h-11 rounded-lg border border-ink/30 bg-paper px-2 text-sm"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
            <option value="unidad">unidad</option>
            <option value="paquete">paquete</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`Precio (${money})`}
            aria-label="Precio"
            className="min-h-11 min-w-0 flex-1 border-b-2 border-ink/40 bg-transparent px-1 font-mono"
          />
          <button type="submit" className="flex min-h-11 items-center gap-1 rounded-lg bg-pen px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
      </form>

      {products.length === 0 ? (
        <p className="p-6 text-center text-sm text-pencil">Aún no hay productos en tu lista.</p>
      ) : (
        <ul className="page pr-3 pl-10">
          {products.map((p) => (
            <li key={p.id} className="flex min-h-14 items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-base font-semibold">{p.name}</span>
                <span className="block text-xs text-pencil">por {p.unit}</span>
              </span>
              {editingId === p.id ? (
                <>
                  <input
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && savePrice(p.id)}
                    aria-label={`Nuevo precio de ${p.name}`}
                    className="min-h-11 w-24 border-b-2 border-pen bg-transparent text-right font-mono"
                  />
                  <button aria-label="Guardar precio" onClick={() => savePrice(p.id)} className="flex min-h-11 min-w-11 items-center justify-center text-ok">
                    <Check className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditPrice(String(p.price));
                  }}
                  aria-label={`Cambiar precio de ${p.name}`}
                  className="min-h-11 rounded-lg px-2 font-mono text-sm font-bold text-pen underline decoration-dotted"
                >
                  {money}
                  {formatNumber(p.price)}
                </button>
              )}
              <button
                aria-label={`Eliminar ${p.name}`}
                onClick={() => confirm(`¿Eliminar ${p.name} de la lista?`) && deleteProduct(p.id)}
                className="flex min-h-11 min-w-11 items-center justify-center text-ink/40 active:text-alert"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
