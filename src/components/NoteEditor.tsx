import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calculator as CalcIcon, Calendar, Check, Copy, ListPlus, Pin, Trash2 } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { extractNumbersAndSum, formatNumber } from '../utils/mathEngine';
import { triggerHaptic } from '../utils/sound';
import { IconBtn } from './ui';

/** Hoja de nota sobre papel rayado. El texto vive en el store (guardado con debounce). */
export function NoteEditor() {
  const { notes, activeNoteId, setActiveNoteId, updateNote, deleteNote, togglePin, setCursorPosition, insertTextAtActiveNote } =
    useNotesStore();
  const { toggleDrawer, settings } = useCalculatorStore();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  const note = notes.find((n) => n.id === activeNoteId);
  const scan = useMemo(() => extractNumbersAndSum(note?.content ?? ''), [note?.content]);
  if (!note) return null;

  const trackCursor = () => {
    const el = ref.current;
    if (el) setCursorPosition({ start: el.selectionStart, end: el.selectionEnd });
  };

  const close = () => {
    // Una nota vacía no se conserva
    if (!note.title.trim() && !note.content.trim()) deleteNote(note.id);
    else setActiveNoteId(null);
  };

  const tool = 'flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold active:bg-ink/10';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="pt-safe flex flex-shrink-0 items-center gap-1 border-b-2 border-ink/80 bg-paper px-2 pb-1">
        <IconBtn label="Volver a las notas" onClick={close}>
          <ArrowLeft className="h-5 w-5" />
        </IconBtn>
        <input
          value={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          placeholder="Título"
          aria-label="Título de la nota"
          className="min-h-11 min-w-0 flex-1 bg-transparent px-1 font-serif text-xl font-bold"
        />
        <IconBtn label={note.isPinned ? 'Desfijar' : 'Fijar'} onClick={() => togglePin(note.id)}>
          <Pin className={`h-5 w-5 ${note.isPinned ? 'fill-margin text-margin' : ''}`} />
        </IconBtn>
        <IconBtn
          label="Copiar nota"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* sin portapapeles */
            }
          }}
        >
          {copied ? <Check className="h-5 w-5 text-ok" /> : <Copy className="h-5 w-5" />}
        </IconBtn>
        <IconBtn
          label="Eliminar nota"
          danger
          onClick={() => {
            if (confirm('¿Eliminar esta nota?')) deleteNote(note.id);
          }}
        >
          <Trash2 className="h-5 w-5" />
        </IconBtn>
      </header>

      <textarea
        ref={ref}
        value={note.content}
        onChange={(e) => {
          updateNote(note.id, { content: e.target.value });
          trackCursor();
        }}
        onSelect={trackCursor}
        onKeyUp={trackCursor}
        onClick={trackCursor}
        placeholder={'Escribe aquí…\nEj: Arriendo 1.200.000\nMercado 350.000 + 120.000'}
        aria-label="Contenido de la nota"
        spellCheck={false}
        className="page min-h-0 flex-1 resize-none py-0 pr-3 pl-10 text-base"
        style={{ lineHeight: 'var(--line)' }}
      />

      {scan.items.length > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between border-t border-rule bg-paper-2 pl-4 text-sm">
          <span>
            Suma de {scan.items.length} cifras:{' '}
            <strong className="font-mono">
              {settings.currencySymbol}
              {formatNumber(scan.total, settings.decimalPlaces)}
            </strong>
          </span>
          <button
            onClick={() => {
              insertTextAtActiveNote(`Total: ${settings.currencySymbol} ${formatNumber(scan.total, settings.decimalPlaces)}`);
              triggerHaptic(15);
            }}
            className="min-h-11 px-3 text-xs font-bold text-pen"
          >
            + Anotar total
          </button>
        </div>
      )}

      <div className="pb-safe flex flex-shrink-0 items-center border-t-2 border-ink/80 bg-paper px-1">
        <button onClick={() => insertTextAtActiveNote('• ')} className={tool}>
          <ListPlus className="h-4 w-4" /> Viñeta
        </button>
        <button
          onClick={() =>
            insertTextAtActiveNote(
              `${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}: `
            )
          }
          className={tool}
        >
          <Calendar className="h-4 w-4" /> Fecha
        </button>
        <button onClick={() => toggleDrawer(true)} className={`${tool} ml-auto text-pen`}>
          <CalcIcon className="h-4 w-4" /> Calculadora
        </button>
      </div>
    </div>
  );
}
