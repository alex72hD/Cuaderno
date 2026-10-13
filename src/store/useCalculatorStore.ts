import { create } from 'zustand';
import type { CalculationHistoryItem, ViewMode, AppSettings } from '../types';
import {
  safeEvaluate,
  formatNumber,
  roundToPrecision,
} from '../utils/mathEngine';
import {
  loadHistoryFromStorage,
  saveHistoryToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from '../storage/localStore';

interface CalculatorState {
  expression: string;
  previewResult: number | null;
  lastCalculatedResult: number | null;
  history: CalculationHistoryItem[];
  isHistoryOpen: boolean;
  viewMode: ViewMode;
  isDrawerOpen: boolean;
  settings: AppSettings;

  // Acciones
  inputKey: (key: string) => void;
  setExpression: (expr: string) => void;
  clearAll: () => void;
  deleteLast: () => void;
  evaluateAndCommit: (noteContext?: { noteId: string; noteTitle: string }) => {
    success: boolean;
    result: number;
    formatted: string;
  };
  applyTax: (customRate?: number) => void;
  applyDiscount: (percent: number) => void;
  toggleSign: () => void;
  clearHistory: () => void;
  setIsHistoryOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleDrawer: (open?: boolean) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  expression: '',
  previewResult: null,
  lastCalculatedResult: null,
  history: loadHistoryFromStorage(),
  isHistoryOpen: false,
  viewMode: 'split',
  isDrawerOpen: false,
  settings: loadSettingsFromStorage(),

  inputKey: (key: string) => {
    const current = get().expression;

    // Prevenir operadores duplicados consecutivos si es inapropiado
    const isOperator = ['+', '-', '*', '/', '×', '÷', '%', '^'].includes(key);
    const lastChar = current.slice(-1);
    const isLastOperator = ['+', '-', '*', '/', '×', '÷', '%', '^'].includes(lastChar);

    let nextExpr = current;

    if (isOperator && isLastOperator && key !== '-') {
      // Reemplaza el operador previo
      nextExpr = current.slice(0, -1) + key;
    } else if (key === '.' || key === ',') {
      // Normalizar punto/coma decimal: evitar doble decimal en el mismo bloque numérico
      const parts = current.split(/[+\-*/×÷%^()]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.') || lastPart.includes(',')) {
        return; // ya tiene decimal
      }
      nextExpr = current + (current === '' ? '0.' : '.');
    } else {
      nextExpr = current + key;
    }

    // Calcular preview en tiempo real si la expresión tiene longitud y es evaluable
    let preview: number | null = null;
    if (nextExpr.length > 0 && /[0-9]/.test(nextExpr)) {
      const evalRes = safeEvaluate(nextExpr);
      if (evalRes.success && !isNaN(evalRes.result)) {
        preview = evalRes.result;
      }
    }

    set({ expression: nextExpr, previewResult: preview });
  },

  setExpression: (expr: string) => {
    let preview: number | null = null;
    if (expr.length > 0 && /[0-9]/.test(expr)) {
      const evalRes = safeEvaluate(expr);
      if (evalRes.success && !isNaN(evalRes.result)) {
        preview = evalRes.result;
      }
    }
    set({ expression: expr, previewResult: preview });
  },

  clearAll: () => {
    set({ expression: '', previewResult: null, lastCalculatedResult: null });
  },

  deleteLast: () => {
    const current = get().expression;
    if (current.length <= 1) {
      set({ expression: '', previewResult: null });
      return;
    }
    const nextExpr = current.slice(0, -1);
    let preview: number | null = null;
    if (nextExpr.length > 0 && /[0-9]/.test(nextExpr)) {
      const evalRes = safeEvaluate(nextExpr);
      if (evalRes.success) {
        preview = evalRes.result;
      }
    }
    set({ expression: nextExpr, previewResult: preview });
  },

  evaluateAndCommit: (noteContext) => {
    const { expression, settings, history } = get();
    const evalRes = safeEvaluate(expression);

    if (!evalRes.success || isNaN(evalRes.result)) {
      return {
        success: false,
        result: 0,
        formatted: 'Error',
      };
    }

    const resNumber = roundToPrecision(evalRes.result, settings.decimalPlaces);
    const formatted = formatNumber(resNumber, settings.decimalPlaces);

    const historyItem: CalculationHistoryItem = {
      id: 'calc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      expression: expression,
      result: resNumber,
      formattedResult: formatted,
      timestamp: Date.now(),
      noteId: noteContext?.noteId,
      noteTitle: noteContext?.noteTitle,
    };

    const nextHistory = [historyItem, ...history];
    saveHistoryToStorage(nextHistory);

    // Tras el igual, la expresión pasa a ser el resultado para operaciones continuas
    set({
      expression: String(resNumber),
      previewResult: null,
      lastCalculatedResult: resNumber,
      history: nextHistory,
    });

    return {
      success: true,
      result: resNumber,
      formatted,
    };
  },

  applyTax: (customRate) => {
    const { expression, settings } = get();
    const rate = customRate !== undefined ? customRate : settings.taxRate;
    const evalRes = safeEvaluate(expression);
    if (evalRes.success && evalRes.result > 0) {
      const withTax = roundToPrecision(evalRes.result * (1 + rate / 100), settings.decimalPlaces);
      set({
        expression: String(withTax),
        previewResult: null,
        lastCalculatedResult: withTax,
      });
    }
  },

  applyDiscount: (percent) => {
    const { expression, settings } = get();
    const evalRes = safeEvaluate(expression);
    if (evalRes.success && evalRes.result > 0) {
      const withDiscount = roundToPrecision(
        evalRes.result * (1 - percent / 100),
        settings.decimalPlaces
      );
      set({
        expression: String(withDiscount),
        previewResult: null,
        lastCalculatedResult: withDiscount,
      });
    }
  },

  toggleSign: () => {
    const { expression } = get();
    if (!expression) return;
    if (expression.startsWith('-')) {
      const positive = expression.substring(1);
      set({ expression: positive, previewResult: safeEvaluate(positive).result });
    } else {
      const negative = '-' + expression;
      set({ expression: negative, previewResult: safeEvaluate(negative).result });
    }
  },

  clearHistory: () => {
    saveHistoryToStorage([]);
    set({ history: [] });
  },

  setIsHistoryOpen: (open) => set({ isHistoryOpen: open }),

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleDrawer: (open) =>
    set((state) => ({
      isDrawerOpen: open !== undefined ? open : !state.isDrawerOpen,
    })),

  updateSettings: (updates) => {
    const merged = { ...get().settings, ...updates };
    saveSettingsToStorage(merged);
    set({ settings: merged });
  },
}));
