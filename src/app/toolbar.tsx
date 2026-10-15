import { Download, Redo2, ScanSearch, Undo2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { t } from '../i18n';
import { fetchStyle, store, useAppState } from '../runtime/state/store';
import { isStyle } from '../runtime/style/types';
import { Button, IconButton } from '../ui/primitives/button';
import { NativeSelect } from '../ui/primitives/input';
import { confirmDialog, promptDialog } from '../ui/dialog/dialog-host';
import { Panel } from '../ui/panel/panel';
import { cn } from '../ui/lib/utils';
import { BASE_STYLES, withDefaultTooltips } from './app-schema';

const Divider = () => <span className="mx-0.5 h-4 w-px bg-ink/[0.1]" aria-hidden />;

export async function loadBaseStyle(id: string) {
  const preset = BASE_STYLES.find((b) => b.id === id);
  const url = preset
    ? preset.url
    : await promptDialog({
        title: t('Eigene Style-URL'),
        message: t('URL einer MapLibre-Style-JSON, z. B. von OpenFreeMap oder einem eigenen Server.'),
        placeholder: 'https://…/style.json',
        defaultValue: 'https://',
        confirmLabel: t('Laden'),
      });
  if (!url || url === 'https://') return;
  if (
    store.getState().canUndo &&
    !(await confirmDialog({
      title: t('Aktuellen Style ersetzen?'),
      message: t('Mit Rückgängig kommst du jederzeit zurück.'),
      confirmLabel: t('Ersetzen'),
    }))
  )
    return;
  const toastId = toast.loading(t('Lade Style …'));
  try {
    const style = await fetchStyle(url);
    store.replace(preset ? withDefaultTooltips(style) : style);
    toast.success(t('„{name}“ geladen', { name: style.name || preset?.label || 'Style' }), { id: toastId });
  } catch (err) {
    toast.error(t('Style konnte nicht geladen werden: {message}', { message: (err as Error).message }), { id: toastId });
  }
}

function importFile(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const style = JSON.parse(String(reader.result));
      if (!isStyle(style)) throw new Error(t('Keine MapLibre-Style-Datei (version 8, sources, layers).'));
      store.replace(style);
      toast.success(t('„{name}“ importiert', { name: style.name || file.name }));
    } catch (err) {
      toast.error(t('Import fehlgeschlagen: {message}', { message: (err as Error).message }));
    }
  };
  reader.readAsText(file);
}

export function Toolbar({ className }: { className?: string }) {
  const canUndo = useAppState((s) => s.canUndo);
  const canRedo = useAppState((s) => s.canRedo);
  const inspect = useAppState((s) => s.inspect);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Panel className={cn('flex-row items-center gap-1 rounded-[14px] p-1.5 [&_button]:rounded-lg [&_select]:rounded-lg', className)}>
      <NativeSelect
        className="w-[150px]"
        value=""
        aria-label={t('Basis-Style laden')}
        onChange={(e) => {
          const id = e.target.value;
          e.target.value = '';
          void loadBaseStyle(id);
        }}
      >
        <option value="" disabled>
          {t('Basis-Style …')}
        </option>
        {BASE_STYLES.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
        <option value="url">{t('Eigene URL …')}</option>
      </NativeSelect>
      <IconButton label={t('Style-JSON importieren')} onClick={() => fileRef.current?.click()}>
        <Upload />
      </IconButton>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFile(file);
          e.target.value = '';
        }}
      />
      <Divider />
      <IconButton label={t('Rückgängig (⌘Z)')} disabled={!canUndo} onClick={() => store.undo()}>
        <Undo2 />
      </IconButton>
      <IconButton label={t('Wiederholen (⇧⌘Z)')} disabled={!canRedo} onClick={() => store.redo()}>
        <Redo2 />
      </IconButton>
      <Divider />
      <Button
        variant="ghost"
        active={inspect}
        className="data-[active=true]:bg-inspect/15 data-[active=true]:text-inspect"
        onClick={() => store.setUi({ inspect: !inspect, inspected: null })}
      >
        <ScanSearch /> {t('Inspektor')}
      </Button>
      <Button variant="primary" onClick={() => store.setUi({ exportOpen: true })}>
        <Download /> {t('Exportieren')}
      </Button>
    </Panel>
  );
}
