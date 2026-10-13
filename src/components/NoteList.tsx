import React, { useMemo } from 'react';
import {
  Search,
  Plus,
  Pin,
  Calendar,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useNotesStore } from '../store/useNotesStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { extractNumbersAndSum, formatNumber } from '../utils/mathEngine';
import { playKeyClick, triggerHaptic } from '../utils/sound';

interface NoteListProps {
  onSelectNote?: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({ onSelectNote }) => {
  const {
    notes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
  } = useNotesStore();

  const { settings } = useCalculatorStore();

  // Categorías únicas disponibles
  const categories = useMemo(() => {
    const set = new Set<string>();
    set.add('Todos');
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  // Filtrar notas por búsqueda y categoría
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesCat =
          selectedCategory === 'Todos' || note.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q);
        return matchesCat && matchesSearch;
      })
      .sort((a, b) => {
        // Fijadas primero, luego por fecha de modificación
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, searchQuery, selectedCategory]);

  const handleCreateNew = () => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(15);
    const newId = createNote(selectedCategory === 'Todos' ? 'General' : selectedCategory);
    setActiveNoteId(newId);
    if (onSelectNote) onSelectNote();
  };

  const handleSelect = (id: string) => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(8);
    setActiveNoteId(id);
    if (onSelectNote) onSelectNote();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/60 overflow-hidden">
      {/* Buscador y Botón de Nueva Nota */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en notas o números..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>

          <button
            onClick={handleCreateNew}
            className="h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nota</span>
          </button>
        </div>

        {/* Filtros de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playKeyClick(settings.hapticSound);
                setSelectedCategory(cat);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Tarjetas de Notas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 opacity-40" />
            <p className="text-xs">No se encontraron notas.</p>
            <button
              onClick={handleCreateNew}
              className="text-xs text-emerald-400 underline font-medium"
            >
              Crear una nueva nota
            </button>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = note.id === activeNoteId;
            const sumData = extractNumbersAndSum(note.content);

            return (
              <div
                key={note.id}
                onClick={() => handleSelect(note.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800/90 text-slate-300'
                }`}
              >
                {/* Indicador de Fijada */}
                {note.isPinned && (
                  <div className="absolute top-2.5 right-2.5">
                    <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mb-1 pr-5">
                  <h3 className="font-semibold text-sm text-white truncate">
                    {note.title || 'Sin título'}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {note.content ? note.content.slice(0, 100) : 'Nota vacía...'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {note.category || 'General'}
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(note.updatedAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {/* Resumen de Cifras si contiene cálculos */}
                  {sumData.items.length > 0 && (
                    <div className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>
                        {settings.currencySymbol} {formatNumber(sumData.total, settings.decimalPlaces)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
