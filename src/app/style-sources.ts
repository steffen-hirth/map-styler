// Starting points besides templates: original base styles, a custom URL or an
// exported style.json.

import { toast } from 'sonner';
import { t } from '../i18n';
import { fetchStyle, store } from '../runtime/state/store';
import { isStyle } from '../runtime/style/types';
import { confirmDialog, promptDialog } from '../ui/dialog/dialog-host';
import { BASE_STYLES, withDefaultTooltips } from './app-schema';

async function confirmReplace(): Promise<boolean> {
  if (!store.getState().canUndo) return true;
  return confirmDialog({
    title: t('Aktuellen Style ersetzen?'),
    message: t('Mit Rückgängig kommst du jederzeit zurück.'),
    confirmLabel: t('Ersetzen'),
  });
}

/** Load an OpenFreeMap base style by id, or ask for a custom URL when id is "url". */
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
  if (!(await confirmReplace())) return;
  const toastId = toast.loading(t('Lade Style …'));
  try {
    const style = await fetchStyle(url);
    store.replace(preset ? withDefaultTooltips(style) : style);
    toast.success(t('„{name}“ geladen', { name: style.name || preset?.label || 'Style' }), { id: toastId });
  } catch (err) {
    toast.error(t('Style konnte nicht geladen werden: {message}', { message: (err as Error).message }), { id: toastId });
  }
}

export async function importStyleFile(file: File) {
  try {
    const style = JSON.parse(await file.text());
    if (!isStyle(style)) throw new Error(t('Keine MapLibre-Style-Datei (version 8, sources, layers).'));
    if (!(await confirmReplace())) return;
    store.replace(style);
    toast.success(t('„{name}“ importiert', { name: style.name || file.name }));
  } catch (err) {
    toast.error(t('Import fehlgeschlagen: {message}', { message: (err as Error).message }));
  }
}
