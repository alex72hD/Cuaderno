import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Scale,
} from 'lucide-react';
import { useOrdersStore } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import type { UnitType } from '../types';
import { formatNumber } from '../utils/mathEngine';
import { playActionSuccess, triggerHaptic } from '../utils/sound';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, addProduct, updateProduct, deleteProduct } = useOrdersStore();
  const { settings } = useCalculatorStore();

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState<UnitType>('kg');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState('');

  if (!isOpen) return null;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice.replace(/\./g, '').replace(',', '.')) || 0;
    if (!newName.trim() || priceNum <= 0) return;

    playActionSuccess(settings.hapticSound);
    triggerHaptic(15);

    addProduct({
      name: newName.trim(),
      price: priceNum,
      unit: newUnit,
      category: 'General',
    });

    setNewName('');
    setNewPrice('');
  };

  const handleSavePrice = (id: string) => {
    const priceNum = parseFloat(editingPrice.replace(/\./g, '').replace(',', '.')) || 0;
    if (priceNum > 0) {
      updateProduct(id, { price: priceNum });
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#faf7ef] dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Cabecera del Catálogo */}
        <div className="p-3.5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                Lista de Precios y Productos
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-slate-400">
                Tus productos con precio por peso o unidad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario Rápido para Añadir Producto */}
        <form
          onSubmit={handleCreateProduct}
          className="p-3 bg-stone-100/90 dark:bg-slate-950/80 border-b border-stone-200 dark:border-slate-800 space-y-2 text-xs"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre (ej: Queso Costeño)"
              className="flex-1 bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-stone-900 dark:text-white focus:outline-none"
            />

            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as UnitType)}
              className="bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-stone-900 dark:text-white text-xs"
            >
              <option value="kg">por kg</option>
              <option value="lb">por lb</option>
              <option value="unidad">unidad</option>
              <option value="paquete">paquete</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative flex items-center">
              <span className="absolute left-2.5 text-stone-400 font-mono">$</span>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Precio (ej: 21000)"
                className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl pl-6 pr-2.5 py-1.5 text-stone-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Guardar</span>
            </button>
          </div>
        </form>

        {/* Lista de Productos Existentes */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {products.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              No tienes productos registrados en la lista de precios.
            </div>
          ) : (
            products.map((prod) => (
              <div
                key={prod.id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-stone-900 dark:text-white truncate">
                    {prod.name}
                  </h4>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400">
                    Unidad: /{prod.unit}
                  </span>
                </div>

                {/* Precio editable con un clic */}
                <div className="flex items-center gap-2">
                  {editingId === prod.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="w-20 bg-stone-100 dark:bg-slate-700 border border-stone-300 dark:border-slate-600 rounded px-1.5 py-0.5 font-mono text-xs text-right"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSavePrice(prod.id)}
                        className="p-1 text-emerald-600 dark:text-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(prod.id);
                        setEditingPrice(String(prod.price));
                      }}
                      className="px-2 py-1 rounded bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-mono font-bold hover:bg-amber-200 border border-amber-300/60 dark:border-amber-900"
                    >
                      {settings.currencySymbol}
                      {formatNumber(prod.price)}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar ${prod.name}?`)) {
                        deleteProduct(prod.id);
                      }
                    }}
                    className="text-stone-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
