import { ChevronRight, Eye, EyeOff, ListTree, MessageSquareText, Rows3, Search } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useScrollFade } from '../../ui/lib/scroll-fade';
import { store, useAppState } from '../../runtime/state/store';
import { t } from '../../i18n';
import { GROUPS, groupLabel, groupOf, type GroupId } from '../../runtime/style/spec';
import { isVisible } from '../../runtime/style/style-utils';
import type { Layer } from '../../runtime/style/types';
import { KEY as TOOLTIP_KEY, type TooltipConfig } from '../../runtime/tooltips';
import { cn } from '../../ui/lib/utils';
import { IconButton } from '../../ui/primitives/button';
import { Input } from '../../ui/primitives/input';
import { LayerSwatch } from '../property-control';

export function LayersPanel() {
  const fade = useScrollFade<HTMLDivElement>();
  const layers = useAppState((s) => s.style.layers);
  const selectedId = useAppState((s) => s.selectedId);
  const tooltipLayers = useAppState((s) => (s.style.metadata?.[TOOLTIP_KEY] as TooltipConfig | undefined)?.layers);
  const [query, setQuery] = useState('');
  const [grouped, setGrouped] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<GroupId>>(() => new Set());

  // Top-most layer first, as in design tools.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...layers].reverse().filter((l) => !q || l.id.toLowerCase().includes(q) || (l['source-layer'] ?? '').includes(q));
  }, [layers, query]);

  const hasTooltip = (id: string) => Boolean(tooltipLayers?.[id]?.enabled);
  const row = (layer: Layer) => (
    <LayerRow key={layer.id} layer={layer} selected={layer.id === selectedId} tooltip={hasTooltip(layer.id)} />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 px-2 pt-2 pb-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-subtle" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('Ebene suchen')} aria-label={t('Ebene suchen')} className="pl-7" />
        </div>
        <IconButton label={grouped ? t('Als Liste zeigen') : t('Nach Gruppen ordnen')} onClick={() => setGrouped((g) => !g)}>
          {grouped ? <Rows3 /> : <ListTree />}
        </IconButton>
      </div>
      <div ref={fade} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-2">
        {!visible.length ? <p className="px-2 py-6 text-center text-2xs text-muted">{t('Keine Ebene gefunden.')}</p> : null}
        {grouped
          ? GROUPS.map(([id]) => {
              const items = visible.filter((l) => groupOf(l) === id);
              if (!items.length) return null;
              const isCollapsed = collapsed.has(id) && !query;
              const allHidden = items.every((l) => !isVisible(l));
              return (
                <div key={id} className="mb-1">
                  <div className="group flex h-7 items-center gap-1 rounded-md pr-0.5 hover:bg-ink/[0.03]">
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      onClick={() =>
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          if (next.has(id)) next.delete(id);
                          else next.add(id);
                          return next;
                        })
                      }
                      className="flex min-w-0 flex-1 items-center gap-1 px-1.5 text-left text-2xs font-medium text-muted outline-none hover:text-foreground"
                    >
                      <ChevronRight className={cn('size-3 shrink-0 transition-transform', !isCollapsed && 'rotate-90')} />
                      <span className="truncate">{groupLabel(id)}</span>
                      <span className="ml-auto pr-1 text-[10px] font-normal text-subtle tabular-nums">{items.length}</span>
                    </button>
                    <IconButton
                      size="sm"
                      label={allHidden ? t('Gruppe einblenden') : t('Gruppe ausblenden')}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[active=true]:opacity-100"
                      active={allHidden}
                      onClick={() => store.setVisibility(items.map((l) => l.id), allHidden)}
                    >
                      {allHidden ? <EyeOff /> : <Eye />}
                    </IconButton>
                  </div>
                  {isCollapsed ? null : <ul className="m-0 list-none p-0">{items.map(row)}</ul>}
                </div>
              );
            })
          : <ul className="m-0 list-none p-0">{visible.map(row)}</ul>}
      </div>
      <p className="shrink-0 border-t border-ink/[0.06] px-3 py-2 text-[10px] text-subtle">
        {t('{n} Ebenen · oben in der Liste = oben auf der Karte', { n: layers.length })}
      </p>
    </div>
  );
}

const LayerRow = memo(function LayerRow({ layer, selected, tooltip }: { layer: Layer; selected: boolean; tooltip: boolean }) {
  const shown = isVisible(layer);
  return (
    <li
      className={cn(
        'group flex h-7 items-center gap-1 rounded-md pr-0.5 pl-3 transition-colors hover:bg-ink/[0.04]',
        selected && 'bg-accent/10 text-accent hover:bg-accent/15',
      )}
    >
      <button
        type="button"
        onClick={() => store.setUi({ selectedId: layer.id })}
        className={cn('flex min-w-0 flex-1 items-center gap-2 text-left text-xs outline-none', !shown && 'opacity-45')}
        title={layer.id}
      >
        <LayerSwatch layer={layer} />
        <span className="truncate">{layer.id}</span>
        {tooltip ? <MessageSquareText className="size-3 shrink-0 text-accent" aria-label={t('Tooltip aktiv')} /> : null}
      </button>
      <IconButton
        size="sm"
        label={shown ? t('Ausblenden') : t('Einblenden')}
        active={!shown}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[active=true]:opacity-100"
        onClick={() => store.setVisibility([layer.id], !shown)}
      >
        {shown ? <Eye /> : <EyeOff />}
      </IconButton>
    </li>
  );
});
