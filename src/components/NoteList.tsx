import { useMemo, useState } from 'react';
import { Pin, Plus, Search, Settings } from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { extractNumbersAndSum, formatNumber } from '../utils/mathEngine';
import { PageHeader, IconBtn } from './ui';

export function NoteList({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { notes, setActiveNoteId, createNote } = useNotesStore();
  const { currencySymbol: money, decimalPlaces } = useCalculatorStore((s) => s.settings);
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned) || b.updatedAt - a.updatedAt);
  }, [notes, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Notas">
        <IconBtn label="Ajustes y respaldo" onClick={onOpenSettings}>
          <Settings className="h-5 w-5" />
        </IconBtn>
      </PageHeader>

      {notes.length > 3 && (
        <div className="relative flex-shrink-0 border-b border-rule px-3 py-1">
          <Search className="pointer-events-none absolute top-1/2 left-5 h-4 w-4 -translate-y-1/2 text-pencil" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en las notas"
            aria-label="Buscar en las notas"
            className="min-h-11 w-full bg-transparent pl-8 text-sm"
          />
        </div>
      )}

      <div className="page min-h-0 flex-1 overflow-y-auto pr-3 pl-10">
        <button
          onClick={createNote}
          className="flex min-h-14 w-full items-center gap-2 text-left font-serif text-lg font-semibold text-pen"
        >
          <Plus className="h-5 w-5" /> Nueva nota
        </button>

        {shown.length === 0 && notes.length > 0 && <p className="rule-line text-sm text-pencil">Sin resultados.</p>}

        {shown.map((n) => {
          const sum = extractNumbersAndSum(n.content);
          const preview = n.content.replace(/\s+/g, ' ').trim();
          return (
            <button
              key={n.id}
              onClick={() => setActiveNoteId(n.id)}
              className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-serif text-lg leading-6 font-semibold">
                  {n.isPinned && <Pin className="h-3.5 w-3.5 flex-shrink-0 fill-margin text-margin" />}
                  <span className="truncate">{n.title || 'Sin título'}</span>
                </span>
                <span className="block truncate text-xs text-pencil">
                  {new Date(n.updatedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  {preview ? ` · ${preview}` : ''}
                </span>
              </span>
              {sum.items.length > 0 && (
                <span className="flex-shrink-0 font-mono text-sm font-bold tabular-nums">
                  {money}
                  {formatNumber(sum.total, decimalPlaces)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
