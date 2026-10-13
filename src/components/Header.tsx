import React from 'react';
import {
  BookOpen,
  Calculator as CalcIcon,
  Columns,
  Volume2,
  VolumeX,
  Download,
  Palette,
  WifiOff,
} from 'lucide-react';
import type { AppTheme } from '../types';
import { useCalculatorStore } from '../store/useCalculatorStore';

interface HeaderProps {
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBackup }) => {
  const { viewMode, setViewMode, settings, updateSettings } = useCalculatorStore();

  const cycleTheme = () => {
    const themes: AppTheme[] = ['dark', 'paper', 'light'];
    const nextIndex = (themes.indexOf(settings.theme) + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  };

  const toggleSound = () => {
    updateSettings({ hapticSound: !settings.hapticSound });
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-3 py-2 pt-safe transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Logo e Indicador Offline */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center shadow-sm shadow-emerald-500/20">
            <span className="text-base select-none">📒</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight flex items-center gap-1.5">
              Cuaderno
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                <WifiOff className="w-2.5 h-2.5" />
                Offline
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Notas & Calculadora Local</p>
          </div>
        </div>

        {/* Selector de Modos de Vista Móvil */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setViewMode('split')}
            title="Vista Dividida (Notas + Calculadora)"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dividido</span>
          </button>

          <button
            onClick={() => setViewMode('notes')}
            title="Solo Cuaderno"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'notes'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notas</span>
          </button>

          <button
            onClick={() => setViewMode('calculator')}
            title="Solo Calculadora"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'calculator'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CalcIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cálculo</span>
          </button>
        </div>

        {/* Acciones Rápidas (Sonido, Tema, Backup) */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            title={settings.hapticSound ? 'Sonido táctil activado' : 'Silencio'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            {settings.hapticSound ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            onClick={cycleTheme}
            title={`Tema actual: ${settings.theme}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Palette className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onOpenBackup}
            title="Respaldar datos locales"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
