import { Check, Link2, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { t } from '../../i18n';
import { mapHolder } from '../../runtime/map/map-holder';
import { store, useAppState } from '../../runtime/state/store';
import { routeBounds, sampleRoute } from '../../runtime/style/route';
import { cn } from '../../ui/lib/utils';
import { confirmDialog } from '../../ui/dialog/dialog-host';
import { Button } from '../../ui/primitives/button';
import { PanelBody } from '../../ui/panel/panel';
import { BASE_STYLES } from '../app-schema';
import { importStyleFile, loadBaseStyle } from '../style-sources';
import { buildTemplate, TEMPLATE_KEY, TEMPLATES, type Template } from '../templates';

export function fitToRoute(bounds = routeBounds(sampleRoute())) {
  const map = mapHolder.get();
  if (!map || !bounds) return;
  const wide = window.innerWidth >= 768;
  map.fitBounds(bounds, {
    padding: wide
      ? { top: 60, bottom: 90, left: 360, right: document.documentElement.dataset.mode === 'expert' ? 370 : 40 }
      : { top: 40, bottom: 40, left: 24, right: 24 },
    maxZoom: 15.5,
    duration: 900,
  });
}

export function TemplatesPanel() {
  const active = useAppState((s) => s.style.metadata?.[TEMPLATE_KEY] as string | undefined);
  const [loading, setLoading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = async (template: Template) => {
    if (loading) return;
    if (
      store.getState().canUndo &&
      !(await confirmDialog({
        title: t('Vorlage „{name}“ laden?', { name: t(template.name) }),
        message: t('Deine Änderungen bleiben über Rückgängig erreichbar.'),
        confirmLabel: t('Vorlage laden'),
      }))
    )
      return;
    setLoading(template.id);
    try {
      store.replace(await buildTemplate(template));
      const map = mapHolder.get();
      if (template.view && map) {
        map.easeTo({ ...template.view, duration: 1400 });
      } else {
        // Flat templates start flat again.
        if (map && (map.getPitch() || map.getBearing())) map.jumpTo({ pitch: 0, bearing: 0 });
        fitToRoute();
      }
      toast.success(t('Vorlage „{name}“ geladen', { name: t(template.name) }));
    } catch (err) {
      toast.error(t('Vorlage konnte nicht geladen werden: {message}', { message: (err as Error).message }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <PanelBody>
      <div className="grid grid-cols-2 gap-2 px-3 pt-1 pb-4">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            active={active === template.id}
            loading={loading === template.id}
            onSelect={() => void apply(template)}
          />
        ))}
      </div>
      <section className="flex flex-col gap-2.5 border-t border-ink/[0.06] px-4 pt-4 pb-5">
        <div className="flex flex-col gap-1">
          <p className="m-0 text-xs font-medium">{t('Anderer Startpunkt')}</p>
          <p className="m-0 text-[10px] leading-relaxed text-subtle">
            {t('Original-Styles von OpenFreeMap, eine eigene Style-URL oder eine gespeicherte style.json.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BASE_STYLES.map((base) => (
            <Button key={base.id} size="sm" onClick={() => void loadBaseStyle(base.id)}>
              {base.label.replace('OpenFreeMap ', '')}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => void loadBaseStyle('url')}>
            <Link2 /> {t('Eigene URL')}
          </Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <Upload /> {t('JSON importieren')}
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void importStyleFile(file);
          }}
        />
      </section>
    </PanelBody>
  );
}

function TemplateCard({ template, active, loading, onSelect }: { template: Template; active: boolean; loading: boolean; onSelect: () => void }) {
  const [c0, c1, c2, glow] = template.preview.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'group flex flex-col gap-1.5 rounded-lg border border-ink/[0.08] bg-popover p-1.5 text-left outline-none transition-[border-color,box-shadow] hover:border-ink/[0.18] focus-visible:ring-2 focus-visible:ring-accent/50',
        active && 'border-accent/60 ring-1 ring-accent/40',
      )}
    >
      <span
        className="relative block h-[72px] overflow-hidden rounded-md"
        style={{
          background: `radial-gradient(70% 70% at 72% 18%, ${glow}cc 0%, transparent 70%), linear-gradient(172deg, ${c0} 0%, ${c1} 48%, ${c2} 100%)`,
        }}
      >
        {/* Rendered map thumbnails (src/dev/render-previews.ts); the gradient shows while loading. */}
        <img
          src={`${import.meta.env.BASE_URL}previews/${template.id}.webp`}
          alt=""
          loading="lazy"
          draggable={false}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <span className="absolute inset-0 rounded-md ring-1 ring-ink/[0.06] ring-inset" />
        {active ? (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-white">
            <Check className="size-2.5" />
          </span>
        ) : null}
        {loading ? (
          <span className="absolute inset-0 grid place-items-center bg-ink/20 backdrop-blur-[2px]">
            <Loader2 className="size-4 animate-spin text-white" />
          </span>
        ) : null}
      </span>
      <span className="px-0.5">
        <span className="block text-xs font-medium">{t(template.name)}</span>
        <span className="line-clamp-2 block text-[10px] leading-snug text-subtle">{t(template.description)}</span>
      </span>
    </button>
  );
}
