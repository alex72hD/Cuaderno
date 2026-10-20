import { useState } from 'react';
import { AlertCircle, Check, Copy, Download, Upload } from 'lucide-react';
import { exportBackupJSON, importBackupJSON, loadSettings } from '../storage/localStore';
import { useNotesStore } from '../store/useNotesStore';
import { useOrdersStore } from '../store/useOrdersStore';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { triggerHaptic } from '../utils/sound';
import { Sheet, Btn } from './ui';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const reloadNotes = useNotesStore((s) => s.reloadNotes);
  const reloadAll = useOrdersStore((s) => s.reloadAll);
  const { settings, updateSettings } = useCalculatorStore();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportBackupJSON()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuaderno_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportBackupJSON());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setStatus({ ok: false, message: 'No se pudo copiar; usa “Descargar”.' });
    }
  };

  const restore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackupJSON(String(reader.result ?? ''));
      setStatus({ ok: res.success, message: res.message });
      if (res.success) {
        reloadNotes();
        reloadAll();
        useCalculatorStore.setState({ settings: loadSettings() });
        triggerHaptic(25);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Sheet title="Ajustes y respaldo" onClose={onClose}>
      <div className="space-y-4 p-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs text-pencil">
            Símbolo de moneda
            <input
              value={settings.currencySymbol}
              maxLength={4}
              onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
              className="mt-1 min-h-11 w-full border-b-2 border-ink/40 bg-transparent font-mono text-base text-ink"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={settings.hapticSound}
              onChange={(e) => updateSettings({ hapticSound: e.target.checked })}
              className="h-5 w-5 accent-pen"
            />
            Sonido y vibración
          </label>
        </div>

        <section className="space-y-2 border-t border-rule pt-3">
          <h3 className="font-serif text-base font-bold">Copia de seguridad</h3>
          <p className="text-xs text-pencil">
            Todo vive en este teléfono. Guarda una copia en un archivo JSON para no perder tu cuaderno.
          </p>
          <div className="flex gap-2">
            <Btn onClick={download} className="flex-1">
              <Download className="h-4 w-4" /> Descargar
            </Btn>
            <Btn variant="line" onClick={copy}>
              {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />} Copiar
            </Btn>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-ink/40 text-sm font-semibold active:bg-ink/10">
            <Upload className="h-4 w-4" /> Restaurar desde archivo
            <input type="file" accept=".json,application/json" onChange={restore} className="hidden" />
          </label>
          {status && (
            <p className={`flex items-start gap-1.5 text-xs ${status.ok ? 'text-ok' : 'text-alert'}`}>
              {status.ok ? <Check className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {status.message}
            </p>
          )}
        </section>
      </div>
    </Sheet>
  );
}
