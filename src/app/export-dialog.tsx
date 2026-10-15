import { Check, Copy, Download, FileCode2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  DEFAULT_CDN_TARGET,
  downloadText,
  embedSnippet,
  isCdnReady,
  jsDelivrUrl,
  standaloneHtml,
  styleFileName,
  type CdnTarget,
} from '../runtime/export/embed';
import { t } from '../i18n';
import { store, useAppState } from '../runtime/state/store';
import { Field } from '../ui/controls/controls';
import { Button, IconButton } from '../ui/primitives/button';
import { Input, Textarea } from '../ui/primitives/input';
import { Panel, PanelBody, PanelHeader, PanelSection } from '../ui/panel/panel';
import { EXPORT_PREFS_KEY } from './app-schema';

function readPrefs(): CdnTarget {
  try {
    return { ...DEFAULT_CDN_TARGET, ...JSON.parse(localStorage.getItem(EXPORT_PREFS_KEY) ?? '{}') };
  } catch {
    return DEFAULT_CDN_TARGET;
  }
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error(t('Kopieren nicht möglich – bitte manuell markieren.'));
        }
      }}
    >
      {done ? <Check /> : <Copy />} {done ? t('Kopiert') : (label ?? t('Kopieren'))}
    </Button>
  );
}

export function ExportDialog() {
  const open = useAppState((s) => s.exportOpen);
  useEffect(() => {
    if (!open) return;
    // Capture phase, so the global Escape shortcut (deselect) does not also fire.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      store.setUi({ exportOpen: false });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-ink/25 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && store.setUi({ exportOpen: false })}
    >
      <ExportContent />
    </div>
  );
}

function ExportContent() {
  const style = useAppState((s) => s.style);
  // The current view travels with the style; MapLibre uses it as start position.
  const json = useMemo(() => {
    const { center, zoom, pitch = 0, bearing = 0 } = store.view;
    return JSON.stringify({ ...style, center, zoom, pitch, bearing }, null, 2);
  }, [style]);
  const [fileName, setFileName] = useState(() => styleFileName(style));
  const [target, setTarget] = useState<CdnTarget>(() => {
    const prefs = readPrefs();
    return prefs.stylePath === DEFAULT_CDN_TARGET.stylePath ? { ...prefs, stylePath: `styles/${styleFileName(style)}` } : prefs;
  });

  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_PREFS_KEY, JSON.stringify(target));
    } catch {
      // Preferences are a convenience only.
    }
  }, [target]);

  const ready = isCdnReady(target);
  const styleUrl = ready ? jsDelivrUrl(target, target.stylePath) : `./${target.stylePath}`;
  const scriptUrl = ready ? jsDelivrUrl(target, target.scriptPath) : `./${target.scriptPath}`;
  const snippet = embedSnippet(styleUrl, scriptUrl, store.view);
  const field = (key: keyof CdnTarget, label: string, placeholder?: string) => (
    <Field label={label} inline>
      <Input value={target[key]} placeholder={placeholder} aria-label={label} onChange={(e) => setTarget({ ...target, [key]: e.target.value })} />
    </Field>
  );

  return (
    <Panel role="dialog" aria-modal="true" aria-label={t('Exportieren')} className="max-h-[88vh] w-full max-w-[560px] bg-popover/95">
      <PanelHeader title={t('Exportieren')}>
        <IconButton label={t('Schließen')} onClick={() => store.setUi({ exportOpen: false })}>
          <X />
        </IconButton>
      </PanelHeader>
      <PanelBody className="border-t border-ink/[0.06]">
        <PanelSection
          title={t('1 · Style-Datei')}
          collapsible={false}
          description={t('Eine Datei mit allen Ebenen und der Tooltip-Konfiguration (unter metadata). Lässt sich jederzeit wieder importieren.')}
        >
          <Field label={t('Dateiname')} inline>
            <Input value={fileName} aria-label={t('Dateiname')} onChange={(e) => setFileName(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-subtle">
              {t('{n} Ebenen', { n: style.layers.length })} · {(json.length / 1024).toFixed(0)} KB
            </span>
            <div className="flex gap-1.5">
              <CopyButton text={json} label={t('JSON kopieren')} />
              <Button size="sm" variant="primary" onClick={() => downloadText(fileName || 'map-style.json', json)}>
                <Download /> {t('Herunterladen')}
              </Button>
            </div>
          </div>
        </PanelSection>

        <PanelSection
          title={t('2 · Über GitHub & jsDelivr ausliefern')}
          collapsible={false}
          description={t('Leg die Style-Datei in dein Repo (z. B. unter styles/), committe sie und setz am besten einen Tag. jsDelivr liefert sie dann kostenlos über ein CDN aus.')}
        >
          {field('user', t('GitHub-Nutzer'), t('dein-name'))}
          {field('repo', 'Repository', 'map-styler')}
          {field('ref', 'Tag / Branch', 'v1.0.0')}
          {field('stylePath', t('Pfad Style'), 'styles/my-style.json')}
          {field('scriptPath', t('Pfad Tooltips'), 'cdn/mapstyler-tooltips.js')}
          <div className="flex flex-col gap-1 rounded-lg bg-ink/[0.03] p-2 font-mono text-[10px] break-all text-muted">
            <span>
              <span className="text-subtle">Style: </span>
              {styleUrl}
            </span>
            <span>
              <span className="text-subtle">Tooltips: </span>
              {scriptUrl}
            </span>
          </div>
          {!ready ? <p className="text-[10px] text-subtle">{t('Ohne Nutzer und Repo zeigt der Code relative Pfade, z. B. für GitHub Pages.')}</p> : null}
          <Field label={t('Einbettungscode')} actions={<CopyButton text={snippet} />}>
            <Textarea readOnly rows={12} value={snippet} aria-label={t('Einbettungscode')} />
          </Field>
          <p className="text-[10px] leading-relaxed text-subtle">
            {t('Tipp: jsDelivr cacht Branches bis zu 12 Stunden. Mit Tags (@v1.0.0) sind Änderungen sofort eindeutig.')}
          </p>
        </PanelSection>

        <PanelSection title={t('3 · Testseite')} collapsible={false} description={t('Eine einzelne HTML-Datei mit Style und Tooltips, zum lokalen Testen oder Weitergeben.')}>
          <Button
            className="self-start"
            onClick={() => downloadText(fileName.replace(/\.json$/i, '') + '.html', standaloneHtml(style, store.view), 'text/html')}
          >
            <FileCode2 /> {t('HTML-Datei herunterladen')}
          </Button>
        </PanelSection>
      </PanelBody>
    </Panel>
  );
}
