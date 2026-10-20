import { useState } from 'react';
import { Check, CornerDownLeft, History } from 'lucide-react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useNotesStore } from '../store/useNotesStore';
import { formatNumber } from '../utils/mathEngine';
import { playKeyClick, playActionSuccess, triggerHaptic } from '../utils/sound';

const ROWS = [
  ['AC', '(', ')', '⌫'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', ',', '=', '+'],
];

const keyStyle = (k: string) => {
  if (k === '=') return 'bg-pen text-white text-2xl';
  if ('÷×-+'.includes(k)) return 'bg-paper-2 border border-ink/30 text-pen text-2xl';
  if (['AC', '(', ')', '⌫'].includes(k)) return 'bg-paper-2 border border-ink/20 text-pencil text-lg';
  return 'bg-white/70 border border-ink/20 text-xl';
};

/** `compact` = panel dentro de una nota (permite insertar el resultado en ella). */
export function Calculator({ compact = false }: { compact?: boolean }) {
  const { expression, previewResult, inputKey, clearAll, deleteLast, evaluateAndCommit, setIsHistoryOpen, settings } =
    useCalculatorStore();
  const { activeNoteId, insertTextAtActiveNote } = useNotesStore();
  const [inserted, setInserted] = useState(false);
  const canInsert = compact && !!activeNoteId;

  const press = (k: string) => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(8);
    if (k === 'AC') clearAll();
    else if (k === '⌫') deleteLast();
    else if (k === '=') {
      if (expression && evaluateAndCommit().success) {
        playActionSuccess(settings.hapticSound);
        triggerHaptic(18);
      }
    } else inputKey(k);
  };

  const insert = () => {
    const expr = expression;
    const res = evaluateAndCommit();
    if (!res.success) return;
    insertTextAtActiveNote(`${expr} = ${settings.currencySymbol} ${res.formatted}`);
    playActionSuccess(settings.hapticSound);
    triggerHaptic(25);
    setInserted(true);
    setTimeout(() => setInserted(false), 1500);
  };

  return (
    <div className="space-y-2 p-3 select-none">
      <div className="rounded-lg border-2 border-ink/80 bg-paper-2 p-3 text-right font-mono">
        <div className="no-scrollbar min-h-6 overflow-x-auto text-sm whitespace-nowrap text-pencil">
          {expression || '\u00a0'}
        </div>
        <div className="min-h-10 truncate text-3xl font-bold tabular-nums">
          {previewResult !== null ? `= ${formatNumber(previewResult, settings.decimalPlaces)}` : expression ? '' : '0'}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsHistoryOpen(true)}
          className="flex min-h-11 items-center gap-1.5 rounded-lg border border-ink/30 px-3 text-xs font-semibold"
        >
          <History className="h-4 w-4" /> Historial
        </button>
        {canInsert && (
          <button
            onClick={insert}
            disabled={!expression}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ok text-xs font-bold text-white"
          >
            {inserted ? <Check className="h-4 w-4" /> : <CornerDownLeft className="h-4 w-4" />}
            {inserted ? 'Anotado' : 'Anotar en la nota'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ROWS.flat().map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            aria-label={k === '⌫' ? 'Borrar' : k === 'AC' ? 'Limpiar todo' : k}
            className={`h-14 rounded-lg font-bold ${keyStyle(k)}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
