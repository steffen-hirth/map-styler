import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { t } from '../../i18n';
import { mapHolder } from '../../runtime/map/map-holder';
import { store, useAppState } from '../../runtime/state/store';
import { routeBounds, sampleRoute } from '../../runtime/style/route';
import { cn } from '../../ui/lib/utils';
import { confirmDialog } from '../../ui/dialog/dialog-host';
import { PanelBody } from '../../ui/panel/panel';
import { buildTemplate, TEMPLATE_KEY, TEMPLATES, type Template } from '../templates';

export function fitToRoute(bounds = routeBounds(sampleRoute())) {
  const map = mapHolder.get();
  if (!map || !bounds) return;
  const wide = window.innerWidth >= 768;
  map.fitBounds(bounds, {
    padding: wide ? { top: 60, bottom: 90, left: 360, right: 370 } : { top: 40, bottom: 40, left: 24, right: 24 },
    maxZoom: 15.5,
    duration: 900,
  });
}

export function TemplatesPanel() {
  const active = useAppState((s) => s.style.metadata?.[TEMPLATE_KEY] as string | undefined);
  const [loading, setLoading] = useState<string | null>(null);

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
      fitToRoute();
      toast.success(t('Vorlage „{name}“ geladen', { name: t(template.name) }));
    } catch (err) {
      toast.error(t('Vorlage konnte nicht geladen werden: {message}', { message: (err as Error).message }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <PanelBody>
      <p className="px-3 pt-1 pb-3 text-[10px] leading-relaxed text-subtle">
        {t('Fertige Kartendesigns mit passenden Tooltips und Beispielroute. Danach lässt sich alles unter Ebenen, Farben, Routen und Tooltips anpassen.')}
      </p>
      <div className="grid grid-cols-2 gap-2 px-3 pb-4">
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
        <svg viewBox="0 0 100 60" className="absolute inset-0 size-full" aria-hidden>
          <path d="M8 50 C 22 42, 28 22, 46 27 S 70 46, 92 12" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" strokeLinecap="round" />
          <path d="M8 50 C 22 42, 28 22, 46 27 S 70 46, 92 12" fill="none" stroke={template.preview.route} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="8" cy="50" r="3" fill="#fff" stroke={template.preview.route} strokeWidth="1.5" />
          <circle cx="92" cy="12" r="3" fill="#fff" stroke={template.preview.route} strokeWidth="1.5" />
        </svg>
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
