import React from 'react';
import {
  X,
  Trash2,
  CornerDownLeft,
  ArrowUpRight,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { useNotesStore } from '../store/useNotesStore';
import { playKeyClick, playActionSuccess, triggerHaptic } from '../utils/sound';

export const CalcHistoryModal: React.FC = () => {
  const {
    history,
    clearHistory,
    setExpression,
    isHistoryOpen,
    setIsHistoryOpen,
    settings,
  } = useCalculatorStore();

  const { activeNoteId, insertTextAtActiveNote } = useNotesStore();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isHistoryOpen) return null;

  const handleLoad = (expr: string) => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(10);
    setExpression(expr);
    setIsHistoryOpen(false);
  };

  const handleInsert = (formatted: string, expr: string) => {
    if (!activeNoteId) return;
    playActionSuccess(settings.hapticSound);
    triggerHaptic(15);
    const textToInsert =
      settings.insertFormat === 'result_only'
        ? `${settings.currencySymbol} ${formatted}`
        : `${expr} = ${settings.currencySymbol} ${formatted}`;

    insertTextAtActiveNote(textToInsert);
    setIsHistoryOpen(false);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      triggerHaptic(8);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      //
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header del Modal */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Cinta de Auditoría y Cálculos</h2>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  playKeyClick(settings.hapticSound);
                  clearHistory();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            )}

            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Operaciones */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No hay cálculos en el historial reciente.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{item.expression}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-base font-bold font-mono text-emerald-400">
                    = {settings.currencySymbol} {item.formattedResult}
                  </div>

                  {/* Acciones para cada resultado */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(item.id, String(item.result))}
                      title="Copiar valor"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs active:scale-95"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleLoad(item.expression)}
                      title="Cargar en la calculadora"
                      className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1 active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Cargar</span>
                    </button>

                    {activeNoteId && (
                      <button
                        onClick={() => handleInsert(item.formattedResult, item.expression)}
                        title="Insertar en la nota activa"
                        className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 active:scale-95 shadow-sm"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span>Insertar</span>
                      </button>
                    )}
                  </div>
                </div>

                {item.noteTitle && (
                  <div className="text-[10px] text-slate-500 italic">
                    Generado en: {item.noteTitle}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
