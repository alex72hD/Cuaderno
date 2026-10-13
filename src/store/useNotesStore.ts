import { create } from 'zustand';
import type { Note } from '../types';
import { loadNotesFromStorage, saveNotesToStorage } from '../storage/localStore';

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  selectedCategory: string;
  cursorPosition: { start: number; end: number } | null;

  // Acciones
  setActiveNoteId: (id: string | null) => void;
  createNote: (category?: string) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setCursorPosition: (pos: { start: number; end: number } | null) => void;
  insertTextAtActiveNote: (textToInsert: string) => void;
  reloadNotes: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadNotesFromStorage(),
  activeNoteId: loadNotesFromStorage()[0]?.id || null,
  searchQuery: '',
  selectedCategory: 'Todos',
  cursorPosition: null,

  setActiveNoteId: (id) => set({ activeNoteId: id }),

  createNote: (category = 'General') => {
    const newNote: Note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: 'Nueva Nota ' + new Date().toLocaleDateString('es-CO'),
      content: '',
      category,
      tags: [category],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: '#3b82f6',
    };

    const updated = [newNote, ...get().notes];
    saveNotesToStorage(updated);
    set({ notes: updated, activeNoteId: newNote.id });
    return newNote.id;
  },

  updateNote: (id, updates) => {
    const updated = get().notes.map((note) => {
      if (note.id === id) {
        return {
          ...note,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return note;
    });

    saveNotesToStorage(updated);
    set({ notes: updated });
  },

  deleteNote: (id) => {
    const current = get().notes;
    const filtered = current.filter((n) => n.id !== id);
    saveNotesToStorage(filtered);

    const nextActive = get().activeNoteId === id ? filtered[0]?.id || null : get().activeNoteId;
    set({ notes: filtered, activeNoteId: nextActive });
  },

  togglePin: (id) => {
    const updated = get().notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    saveNotesToStorage(updated);
    set({ notes: updated });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  setCursorPosition: (cursorPosition) => set({ cursorPosition }),

  insertTextAtActiveNote: (textToInsert) => {
    const { activeNoteId, notes, cursorPosition } = get();
    if (!activeNoteId) return;

    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;

    let newContent = '';
    const pos = cursorPosition || {
      start: note.content.length,
      end: note.content.length,
    };

    const before = note.content.substring(0, pos.start);
    const after = note.content.substring(pos.end);

    // Asegurar espaciado limpio si se inserta en una nueva línea o entre texto
    const needsLeadingNewline = before.length > 0 && !before.endsWith('\n') && !before.endsWith(' ');
    const prefix = needsLeadingNewline ? '\n' : '';

    newContent = before + prefix + textToInsert + after;

    const updated = notes.map((n) =>
      n.id === activeNoteId
        ? {
            ...n,
            content: newContent,
            updatedAt: Date.now(),
          }
        : n
    );

    saveNotesToStorage(updated);

    // Actualizar nueva posición del cursor
    const newCursor = pos.start + prefix.length + textToInsert.length;
    set({
      notes: updated,
      cursorPosition: { start: newCursor, end: newCursor },
    });
  },

  reloadNotes: () => {
    const reloaded = loadNotesFromStorage();
    set({ notes: reloaded, activeNoteId: reloaded[0]?.id || null });
  },
}));
