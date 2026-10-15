// Composition root: map canvas, floating panels, toolbar and dialogs.

import { Layers, LayoutTemplate, Map as MapIcon, MessageSquareText, Palette, RefreshCw, Route, SlidersHorizontal } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { setLang, t, useLang } from '../i18n';
import { Toaster } from 'sonner';
import { MapCanvas } from '../runtime/map/map-canvas';
import { store, useAppState, type Tab } from '../runtime/state/store';
import { DialogHost } from '../ui/dialog/dialog-host';
import { cn } from '../ui/lib/utils';
import { Button } from '../ui/primitives/button';
import { Panel, PanelHeader, PanelTabs } from '../ui/panel/panel';
import { APP_NAME } from './app-schema';
import { ExportDialog } from './export-dialog';
import { GlobalPanel } from './panels/global-panel';
import { InspectorCard } from './panels/inspector-card';
import { LayersPanel } from './panels/layers-panel';
import { PalettePanel } from './panels/palette-panel';
import { PropertiesPanel } from './panels/properties-panel';
import { RoutePanel } from './panels/route-panel';
import { TemplatesPanel } from './panels/templates-panel';
import { TooltipsPanel } from './panels/tooltips-panel';
import { buildTemplate, TEMPLATES } from './templates';
import { Toolbar } from './toolbar';

const TABS: Array<{ value: Tab; label: string; icon: ReactNode }> = [
  { value: 'templates', label: 'Vorlagen', icon: <LayoutTemplate /> },
  { value: 'layers', label: 'Ebenen', icon: <Layers /> },
  { value: 'palette', label: 'Farben', icon: <Palette /> },
  { value: 'route', label: 'Routen', icon: <Route /> },
  { value: 'tooltips', label: 'Tooltips', icon: <MessageSquareText /> },
  { value: 'global', label: 'Global', icon: <SlidersHorizontal /> },
];

const START_TEMPLATE = TEMPLATES.find((t) => t.id === 'standard') ?? TEMPLATES[0];

async function boot() {
  if (store.restore()) return;
  try {
    store.load(await buildTemplate(START_TEMPLATE));
  } catch (err) {
    store.fail((err as Error).message);
  }
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      } else if (e.key === 'Escape') {
        const { inspect, selectedId, exportOpen } = store.getState();
        if (exportOpen || target?.closest('[role="dialog"]')) return;
        if (inspect) store.setUi({ inspect: false, inspected: null });
        else if (selectedId) store.setUi({ selectedId: null });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function LangSwitch() {
  const lang = useLang();
  return (
    <div role="group" aria-label="Language" className="flex h-6 items-center rounded-md bg-well p-0.5 text-[10px] font-semibold ring-1 ring-ink/[0.05] ring-inset">
      {(['en', 'de'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={lang === value}
          onClick={() => setLang(value)}
          className={cn(
            'h-5 rounded-[4px] px-1.5 uppercase text-subtle transition-colors hover:text-foreground',
            lang === value && 'bg-popover text-foreground shadow-[0_1px_2px_rgba(40,32,48,0.12)]',
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function LeftPanel({ className }: { className?: string }) {
  const tab = useAppState((s) => s.tab);
  return (
    <Panel className={className}>
      <PanelHeader
        title={APP_NAME}
        icon={
          <span className="brand-gradient flex size-5 items-center justify-center rounded-md text-[#f2efe8] shadow-sm">
            <MapIcon className="size-3" />
          </span>
        }
      >
        <LangSwitch />
      </PanelHeader>
      <PanelTabs value={tab} items={TABS.map((item) => ({ ...item, label: t(item.label) }))} onChange={(value) => store.setUi({ tab: value })} />
      {tab === 'templates' ? <TemplatesPanel /> : null}
      {tab === 'route' ? <RoutePanel /> : null}
      {tab === 'layers' ? <LayersPanel /> : null}
      {tab === 'palette' ? <PalettePanel /> : null}
      {tab === 'global' ? <GlobalPanel /> : null}
      {tab === 'tooltips' ? <TooltipsPanel /> : null}
    </Panel>
  );
}

export function AppComposition() {
  const status = useAppState((s) => s.status);
  const error = useAppState((s) => s.error);
  const hasSelection = useAppState((s) => s.selectedId !== null);
  const lang = useLang();
  useShortcuts();

  useEffect(() => {
    void boot();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {status === 'ready' ? <MapCanvas /> : null}

      {status === 'loading' ? (
        <div className="brand-gradient absolute inset-0 grid place-items-center text-xs-plus text-[#f2efe8]">{t('Lade Karte …')}</div>
      ) : null}

      {status === 'error' ? (
        <div className="absolute inset-0 grid place-items-center p-6">
          <Panel className="max-w-sm gap-3 p-5 text-center">
            <p className="text-xs-plus font-medium">{t('Der Basis-Style ließ sich nicht laden.')}</p>
            <p className="text-2xs text-muted">{error}</p>
            <Button className="self-center" onClick={() => void boot()}>
              <RefreshCw /> {t('Nochmal versuchen')}
            </Button>
          </Panel>
        </div>
      ) : null}

      {status === 'ready' ? (
        <div key={`ui-${lang}`} className="pointer-events-none absolute inset-0 z-10">
          <LeftPanel
            className={cn(
              'absolute top-3 bottom-3 left-3 w-[320px]',
              'max-md:inset-x-2 max-md:top-auto max-md:bottom-16 max-md:h-[44vh] max-md:w-auto',
              hasSelection && 'max-md:hidden',
            )}
          />
          <PropertiesPanel
            className={cn(
              'absolute top-3 right-3 bottom-3 w-[332px]',
              'max-md:inset-x-2 max-md:top-auto max-md:bottom-16 max-md:h-[44vh] max-md:w-auto',
              !hasSelection && 'max-md:hidden',
            )}
          />
          <InspectorCard className="absolute top-3 left-1/2 -translate-x-1/2 max-md:inset-x-2 max-md:w-auto max-md:translate-x-0" />
          <Toolbar className="absolute bottom-3 left-1/2 -translate-x-1/2 max-md:bottom-2 max-md:max-w-[calc(100vw-1rem)] max-md:overflow-x-auto" />
        </div>
      ) : null}

      <ExportDialog key={`export-${lang}`} />
      <DialogHost />
      <Toaster theme="light" position="top-center" toastOptions={{ className: 'text-xs' }} />
    </div>
  );
}
