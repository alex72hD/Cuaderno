import { useState } from 'react';
import { Check, Copy, CornerDownLeft, Trash2 } from 'lucide-react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useNotesStore } from '../store/useNotesStore';
import { triggerHaptic } from '../utils/sound';
import { Sheet } from './ui';

export function CalcHistoryModal() {
  const { history, clearHistory, setExpression, isHistoryOpen, setIsHistoryOpen, isDrawerOpen, settings } =
    useCalculatorStore();
  const { activeNoteId, insertTextAtActiveNote } = useNotesStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isHistoryOpen) return null;
  const close = () => setIsHistoryOpen(false);
  const canInsert = isDrawerOpen && !!activeNoteId;

  return (
    <Sheet title="Cinta de cálculos" onClose={close}>
      {history.length === 0 ? (
        <p className="p-6 text-center text-sm text-pencil">Aún no hay cálculos.</p>
      ) : (
        <>
          <div className="page px-3 pl-10">
            {history.map((h) => (
              <div key={h.id} className="border-b border-rule py-1.5">
                <p className="truncate font-mono text-xs text-pencil">{h.expression}</p>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => {
                      setExpression(h.expression);
                      close();
                    }}
                    className="min-h-11 flex-1 text-left font-mono text-lg font-bold"
                    aria-label={`Cargar ${h.expression} en la calculadora`}
                  >
                    = {settings.currencySymbol} {h.formattedResult}
                  </button>
                  <button
                    aria-label="Copiar valor"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(String(h.result));
                        setCopiedId(h.id);
                        triggerHaptic(8);
                        setTimeout(() => setCopiedId(null), 1200);
                      } catch {
                        /* sin portapapeles */
                      }
                    }}
                    className="flex min-h-11 min-w-11 items-center justify-center text-ink/60"
                  >
                    {copiedId === h.id ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
                  </button>
                  {canInsert && (
                    <button
                      aria-label="Anotar en la nota"
                      onClick={() => {
                        insertTextAtActiveNote(`${h.expression} = ${settings.currencySymbol} ${h.formattedResult}`);
                        close();
                      }}
                      className="flex min-h-11 min-w-11 items-center justify-center text-pen"
                    >
                      <CornerDownLeft className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={clearHistory}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 text-xs font-semibold text-alert"
          >
            <Trash2 className="h-4 w-4" /> Vaciar cinta
          </button>
        </>
      )}
    </Sheet>
  );
}
