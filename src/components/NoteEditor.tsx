import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Pin,
  Trash2,
  Share2,
  Calendar,
  DollarSign,
  ListPlus,
  Calculator as CalcIcon,
  Check,
  Tag,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { extractNumbersAndSum, formatNumber } from '../utils/mathEngine';
import { playKeyClick, triggerHaptic } from '../utils/sound';

interface NoteEditorProps {
  onBackToList?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ onBackToList }) => {
  const {
    activeNoteId,
    notes,
    updateNote,
    deleteNote,
    togglePin,
    setCursorPosition,
    insertTextAtActiveNote,
  } = useNotesStore();

  const { setExpression, toggleDrawer, settings } = useCalculatorStore();

  const activeNote = notes.find((n) => n.id === activeNoteId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Estados locales temporales para debounce suave
  const [localTitle, setLocalTitle] = useState(activeNote?.title || '');
  const [localContent, setLocalContent] = useState(activeNote?.content || '');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sincronizar cuando cambia de nota activa
  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title);
      setLocalContent(activeNote.content);
    }
  }, [activeNoteId]);

  // Auto-guardado con debounce de 350ms para evitar pérdidas de datos en móvil
  useEffect(() => {
    if (!activeNoteId || !activeNote) return;

    const timer = setTimeout(() => {
      if (localTitle !== activeNote.title || localContent !== activeNote.content) {
        updateNote(activeNoteId, {
          title: localTitle || 'Nota sin título',
          content: localContent,
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localTitle, localContent, activeNoteId]);

  // Actualizar posición del cursor para inserciones de la calculadora
  const handleCursorUpdate = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      setCursorPosition({ start: selectionStart, end: selectionEnd });
    }
  };

  // Detector inteligente de números y sumas contables dentro de la nota
  const mathScan = useMemo(() => {
    return extractNumbersAndSum(localContent);
  }, [localContent]);

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <p className="text-sm">Selecciona o crea una nota para comenzar a escribir y calcular.</p>
      </div>
    );
  }

  // Copiar nota al portapapeles
  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(`${localTitle}\n\n${localContent}`);
      setCopiedNotification(true);
      triggerHaptic(10);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Insertar viñeta rápida
  const handleInsertBullet = () => {
    insertTextAtActiveNote('\n• ');
    triggerHaptic(5);
  };

  // Insertar fecha actual
  const handleInsertDate = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    insertTextAtActiveNote(`[${dateStr}] `);
    triggerHaptic(5);
  };

  // Cargar suma automática en la calculadora
  const handleSendSumToCalc = () => {
    if (mathScan.items.length > 0) {
      const expr = mathScan.items.join(' + ');
      setExpression(expr);
      toggleDrawer(true);
      triggerHaptic(15);
    }
  };

  // Insertar total calculado directamente al final de la nota
  const handleInsertTotalLine = () => {
    if (mathScan.items.length > 0) {
      const formattedTotal = formatNumber(mathScan.total, settings.decimalPlaces);
      insertTextAtActiveNote(`\nTotal calculado: ${settings.currencySymbol} ${formattedTotal}`);
      triggerHaptic(20);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* Barra Superior del Editor */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all md:hidden"
              title="Volver a la lista de notas"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            <Tag className="w-2.5 h-2.5 text-emerald-400" />
            <span>{activeNote.category || 'General'}</span>
          </div>

          <span className="text-[10px] text-slate-500 truncate">
            {new Date(activeNote.updatedAt).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Acciones de la Nota (Fijar, Copiar, Eliminar) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playKeyClick(settings.hapticSound);
              togglePin(activeNote.id);
            }}
            title={activeNote.isPinned ? 'Desfijar nota' : 'Fijar nota'}
            className={`p-1.5 rounded-lg transition-all active:scale-95 ${
              activeNote.isPinned
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyNote}
            title="Copiar nota al portapapeles"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all relative"
          >
            {copiedNotification ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="Eliminar nota"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cuadro de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 p-2.5 px-3 flex items-center justify-between gap-2 text-xs text-rose-300">
          <span>¿Seguro que deseas eliminar esta nota?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                deleteNote(activeNote.id);
                setShowDeleteConfirm(false);
                if (onBackToList) onBackToList();
              }}
              className="px-2 py-1 rounded bg-rose-600 text-white font-medium hover:bg-rose-500"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Entrada de Título */}
      <div className="px-3 pt-2">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          placeholder="Título de la nota o cuenta..."
          className="w-full bg-transparent text-lg font-bold text-white placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-slate-700/80 pb-1 transition-colors"
        />
      </div>

      {/* Barra Asistente Inteligente de Cuentas (Detecta cifras en la nota) */}
      {mathScan.items.length > 0 && (
        <div className="mx-3 my-1.5 p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">
              Detectados {mathScan.items.length} valores ={' '}
              <strong className="text-emerald-400">
                {settings.currencySymbol} {formatNumber(mathScan.total, settings.decimalPlaces)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleSendSumToCalc}
              title="Cargar esta suma en la calculadora"
              className="px-2 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 active:scale-95 text-[11px] font-medium flex items-center gap-1"
            >
              <CalcIcon className="w-3 h-3" />
              <span>Calcular</span>
            </button>

            <button
              onClick={handleInsertTotalLine}
              title="Insertar renglón de Total al final"
              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 active:scale-95 text-[11px] font-medium"
            >
              + Total
            </button>
          </div>
        </div>
      )}

      {/* Área de Texto Principal de la Nota */}
      <div className="flex-1 px-3 py-1 flex flex-col min-h-0">
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => {
            setLocalContent(e.target.value);
            handleCursorUpdate();
          }}
          onSelect={handleCursorUpdate}
          onKeyUp={handleCursorUpdate}
          onClick={handleCursorUpdate}
          placeholder="Escribe tus notas, listas de gastos o cuentas aquí...&#10;Ejemplo:&#10;• Arriendo: 1.200.000&#10;• Supermercado: 350.000 + 120.000"
          className="w-full flex-1 bg-transparent text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-sans text-sm leading-relaxed"
        />
      </div>

      {/* Barra de Atajos Rápidos de Escritura en Móvil */}
      <div className="px-3 py-1.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <button
            onClick={handleInsertBullet}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 active:scale-95"
            title="Añadir viñeta"
          >
            <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Viñeta</span>
          </button>

          <button
            onClick={handleInsertDate}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 active:scale-95"
            title="Añadir fecha"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Fecha</span>
          </button>

          <button
            onClick={() => insertTextAtActiveNote(`${settings.currencySymbol} `)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 active:scale-95"
            title="Añadir símbolo de moneda"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>{settings.currencySymbol}</span>
          </button>
        </div>

        {/* Botón para abrir el panel de calculadora si está en modo notas */}
        <button
          onClick={() => toggleDrawer(true)}
          className="px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-medium active:scale-95"
        >
          <CalcIcon className="w-3.5 h-3.5" />
          <span>Calculadora</span>
        </button>
      </div>
    </div>
  );
};
