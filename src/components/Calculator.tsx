import React, { useState } from 'react';
import {
  History,
  Delete,
  CornerDownLeft,
  Check,
  Minus,
  Sparkles,
} from 'lucide-react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useNotesStore } from '../store/useNotesStore';
import { formatNumber } from '../utils/mathEngine';
import { playKeyClick, playActionSuccess, triggerHaptic } from '../utils/sound';

interface CalculatorProps {
  compact?: boolean;
}

export const Calculator: React.FC<CalculatorProps> = ({ compact = false }) => {
  const {
    expression,
    previewResult,
    inputKey,
    clearAll,
    deleteLast,
    evaluateAndCommit,
    applyTax,
    applyDiscount,
    toggleSign,
    setIsHistoryOpen,
    settings,
  } = useCalculatorStore();

  const { activeNoteId, notes, insertTextAtActiveNote } = useNotesStore();
  const [insertSuccessAnim, setInsertSuccessAnim] = useState(false);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Manejar pulsación de tecla con retroalimentación sonora y háptica
  const handleKey = (key: string) => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(8);
    inputKey(key);
  };

  const handleClear = () => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(12);
    clearAll();
  };

  const handleDelete = () => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(8);
    deleteLast();
  };

  const handleEquals = () => {
    if (!expression) return;
    const res = evaluateAndCommit(
      activeNote ? { noteId: activeNote.id, noteTitle: activeNote.title } : undefined
    );
    if (res.success) {
      playActionSuccess(settings.hapticSound);
      triggerHaptic(18);
    }
  };

  // Inserción directa del resultado en la nota activa
  const handleInsertIntoNote = (format: 'result' | 'formula' = 'formula') => {
    if (!activeNote) return;

    let textToInsert = '';
    const evalRes = evaluateAndCommit({
      noteId: activeNote.id,
      noteTitle: activeNote.title,
    });

    if (!evalRes.success) return;

    if (format === 'result' || settings.insertFormat === 'result_only') {
      textToInsert = `${settings.currencySymbol} ${evalRes.formatted}`;
    } else {
      // Formato con desglose: "15.000 + 3.200 = $ 18.200"
      textToInsert = `${expression} = ${settings.currencySymbol} ${evalRes.formatted}`;
    }

    insertTextAtActiveNote(textToInsert);
    playActionSuccess(settings.hapticSound);
    triggerHaptic(25);

    setInsertSuccessAnim(true);
    setTimeout(() => setInsertSuccessAnim(false), 1600);
  };

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col bg-slate-900/95 border-t border-slate-800 ${compact ? 'p-2' : 'p-3'} select-none`}>
      {/* Barra de Contexto: Nota Vinculada & Historial */}
      <div className="flex items-center justify-between pb-1.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate max-w-[220px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="truncate">
            {activeNote ? `En nota: "${activeNote.title}"` : 'Sin nota seleccionada'}
          </span>
        </div>

        <button
          onClick={() => {
            playKeyClick(settings.hapticSound);
            setIsHistoryOpen(true);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>Historial</span>
        </button>
      </div>

      {/* Pantalla de Cálculo: Expresión viva y resultado dinámico */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-2 shadow-inner">
        <div className="min-h-[26px] text-right font-mono text-sm tracking-wider text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
          {expression || '0'}
        </div>
        <div className="min-h-[36px] flex items-baseline justify-end gap-1.5 font-mono">
          {previewResult !== null && (
            <span className="text-xs text-emerald-400 font-sans tracking-wide">Previa:</span>
          )}
          <span className="text-2xl font-bold tracking-tight text-white truncate">
            {previewResult !== null
              ? `= ${formatNumber(previewResult, settings.decimalPlaces)}`
              : expression
              ? '= ' + expression
              : '0'}
          </span>
        </div>
      </div>

      {/* Botón de Sinergia Principal: Transferir a la Nota Activa */}
      {activeNote && (
        <div className="mb-2">
          <button
            onClick={() => handleInsertIntoNote('formula')}
            disabled={!expression}
            className={`w-full py-2 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              insertSuccessAnim
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : expression
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-sm font-semibold active:scale-[0.98]'
                : 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
            }`}
          >
            {insertSuccessAnim ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>¡Insertado en la nota!</span>
              </>
            ) : (
              <>
                <CornerDownLeft className="w-4 h-4" />
                <span>Insertar resultado en la nota</span>
                <span className="text-[10px] opacity-80 bg-black/20 px-1.5 py-0.5 rounded">
                  al cursor
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Barra de Funciones Rápidas Contables (+IVA, Descuentos, Signo) */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        <button
          onClick={() => {
            playKeyClick(settings.hapticSound);
            applyTax();
          }}
          className="h-9 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-medium text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <Sparkles className="w-3 h-3" />
          <span>+{settings.taxRate}% IVA</span>
        </button>

        <button
          onClick={() => {
            playKeyClick(settings.hapticSound);
            applyDiscount(5);
          }}
          className="h-9 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-medium text-xs flex items-center justify-center gap-0.5 active:scale-95 transition-all"
        >
          <Minus className="w-3 h-3" />
          <span>5% Desc</span>
        </button>

        <button
          onClick={() => {
            playKeyClick(settings.hapticSound);
            applyDiscount(10);
          }}
          className="h-9 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-medium text-xs flex items-center justify-center gap-0.5 active:scale-95 transition-all"
        >
          <Minus className="w-3 h-3" />
          <span>10% Desc</span>
        </button>

        <button
          onClick={() => {
            playKeyClick(settings.hapticSound);
            toggleSign();
          }}
          className="h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center active:scale-95 transition-all"
        >
          +/-
        </button>
      </div>

      {/* Teclado Táctil Móvil Ergonómico (Touch Targets >= 48px) */}
      <div className="grid grid-cols-4 gap-2">
        {/* Fila 1 */}
        <button
          onClick={handleClear}
          className="h-12 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-sm border border-rose-500/30 active:scale-95 transition-transform"
        >
          AC
        </button>
        <button
          onClick={() => handleKey('(')}
          className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base active:scale-95 transition-transform"
        >
          (
        </button>
        <button
          onClick={() => handleKey(')')}
          className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base active:scale-95 transition-transform"
        >
          )
        </button>
        <button
          onClick={handleDelete}
          className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold flex items-center justify-center active:scale-95 transition-transform"
        >
          <Delete className="w-5 h-5" />
        </button>

        {/* Fila 2 */}
        <button
          onClick={() => handleKey('7')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          7
        </button>
        <button
          onClick={() => handleKey('8')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          8
        </button>
        <button
          onClick={() => handleKey('9')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          9
        </button>
        <button
          onClick={() => handleKey('÷')}
          className="h-12 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold text-xl border border-indigo-500/30 active:scale-95 transition-transform"
        >
          ÷
        </button>

        {/* Fila 3 */}
        <button
          onClick={() => handleKey('4')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          4
        </button>
        <button
          onClick={() => handleKey('5')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          5
        </button>
        <button
          onClick={() => handleKey('6')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          6
        </button>
        <button
          onClick={() => handleKey('×')}
          className="h-12 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold text-xl border border-indigo-500/30 active:scale-95 transition-transform"
        >
          ×
        </button>

        {/* Fila 4 */}
        <button
          onClick={() => handleKey('1')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          1
        </button>
        <button
          onClick={() => handleKey('2')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          2
        </button>
        <button
          onClick={() => handleKey('3')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          3
        </button>
        <button
          onClick={() => handleKey('-')}
          className="h-12 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold text-xl border border-indigo-500/30 active:scale-95 transition-transform"
        >
          -
        </button>

        {/* Fila 5 */}
        <button
          onClick={() => handleKey('0')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          0
        </button>
        <button
          onClick={() => handleKey(',')}
          className="h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xl active:scale-95 transition-transform"
        >
          ,
        </button>
        <button
          onClick={handleEquals}
          className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-2xl shadow-md shadow-emerald-500/20 active:scale-95 transition-transform flex items-center justify-center"
        >
          =
        </button>
        <button
          onClick={() => handleKey('+')}
          className="h-12 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold text-xl border border-indigo-500/30 active:scale-95 transition-transform"
        >
          +
        </button>
      </div>
    </div>
  );
};
