import { create } from 'zustand';
import type { Note } from '../types';
import { loadNotes, saveNotes } from '../storage/localStore';

interface NotesState {
  notes: Note[];
  activeNoteId: string | null; // null = índice de notas
  cursorPosition: { start: number; end: number } | null;

  setActiveNoteId: (id: string | null) => void;
  createNote: () => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  setCursorPosition: (pos: { start: number; end: number } | null) => void;
  insertTextAtActiveNote: (text: string) => void;
  reloadNotes: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => {
  const commit = (notes: Note[], extra: Partial<NotesState> = {}) => {
    saveNotes(notes);
    set({ notes, ...extra });
  };

  return {
    notes: loadNotes(),
    activeNoteId: null,
    cursorPosition: null,

    setActiveNoteId: (id) => set({ activeNoteId: id, cursorPosition: null }),

    createNote: () => {
      const now = Date.now();
      const note: Note = {
        id: 'note-' + now + '-' + Math.random().toString(36).slice(2, 7),
        title: '',
        content: '',
        createdAt: now,
        updatedAt: now,
      };
      commit([note, ...get().notes], { activeNoteId: note.id, cursorPosition: null });
      return note.id;
    },

    updateNote: (id, updates) =>
      commit(get().notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))),

    deleteNote: (id) =>
      commit(
        get().notes.filter((n) => n.id !== id),
        get().activeNoteId === id ? { activeNoteId: null } : {}
      ),

    togglePin: (id) =>
      commit(get().notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))),

    setCursorPosition: (cursorPosition) => set({ cursorPosition }),

    insertTextAtActiveNote: (text) => {
      const { activeNoteId, notes, cursorPosition } = get();
      const note = notes.find((n) => n.id === activeNoteId);
      if (!note) return;

      const end = note.content.length;
      const start = Math.min(cursorPosition?.start ?? end, end);
      const stop = Math.min(cursorPosition?.end ?? end, end);
      const before = note.content.slice(0, start);
      const after = note.content.slice(stop);
      const prefix = before && !before.endsWith('\n') && !before.endsWith(' ') ? '\n' : '';
      const caret = start + prefix.length + text.length;

      commit(
        notes.map((n) =>
          n.id === note.id
            ? { ...n, content: before + prefix + text + after, updatedAt: Date.now() }
            : n
        ),
        { cursorPosition: { start: caret, end: caret } }
      );
    },

    reloadNotes: () => set({ notes: loadNotes(), activeNoteId: null, cursorPosition: null }),
  };
});
