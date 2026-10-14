import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  Settings,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { exportBackupJSON, importBackupJSON } from '../storage/localStore';
import { useNotesStore } from '../store/useNotesStore';
import { useOrdersStore } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { playKeyClick, triggerHaptic } from '../utils/sound';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { reloadNotes } = useNotesStore();
  const { reloadAll } = useOrdersStore();
  const { settings, updateSettings } = useCalculatorStore();

  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [copiedBackup, setCopiedBackup] = useState(false);

  if (!isOpen) return null;

  // Descargar archivo JSON local
  const handleDownload = () => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(15);
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuaderno_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copiar JSON al portapapeles
  const handleCopyClipboard = async () => {
    playKeyClick(settings.hapticSound);
    triggerHaptic(10);
    const jsonStr = exportBackupJSON();
    await navigator.clipboard.writeText(jsonStr);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  // Importar desde archivo seleccionado
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importBackupJSON(content);
        setImportStatus(res);
        if (res.success) {
          reloadNotes();
          reloadAll();
          triggerHaptic(25);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Configuración y Respaldo Local</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Ajustes de Preferencias Financieras */}
          <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              <span>Moneda y Cálculos</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Símbolo de Moneda</label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tasa IVA / Impuesto (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => updateSettings({ taxRate: Number(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Formato al Insertar en Notas</label>
              <select
                value={settings.insertFormat}
                onChange={(e) =>
                  updateSettings({
                    insertFormat: e.target.value as 'result_only' | 'expr_and_result',
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="expr_and_result">Operación completa (ej: 10 + 5 = $ 15)</option>
                <option value="result_only">Solo el resultado (ej: $ 15)</option>
              </select>
            </div>
          </div>

          {/* Garantía de Privacidad Offline */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2 text-emerald-300">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <div>
              <strong className="block font-semibold">100% Privado y Offline</strong>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                Tus notas y cuentas se guardan exclusivamente en la memoria de este teléfono. Ningún
                dato viaja por internet.
              </p>
            </div>
          </div>

          {/* Exportación de Respaldo */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-white">Exportar Copia de Seguridad</h3>
            <p className="text-slate-400 text-[11px]">
              Descarga o copia todo tu cuaderno para guardarlo en tu tarjeta de memoria o transferirlo
              a otro dispositivo sin internet.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleDownload}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo</span>
              </button>

              <button
                onClick={handleCopyClipboard}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {copiedBackup ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>Copiar</span>
              </button>
            </div>
          </div>

          {/* Importación de Respaldo */}
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-white">Restaurar Copia de Seguridad</h3>
            <p className="text-slate-400 text-[11px]">
              Carga un archivo de respaldo previo en formato JSON:
            </p>

            <label className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Seleccionar Archivo JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div
                className={`p-2.5 rounded-lg flex items-center gap-2 text-[11px] ${
                  importStatus.success
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                {importStatus.success ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
