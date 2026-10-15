import { MessageSquarePlus, ScanSearch, X } from 'lucide-react';
import { store, useAppState } from '../../runtime/state/store';
import { t } from '../../i18n';
import { groupLabel, groupOf } from '../../runtime/style/spec';
import { IconButton } from '../../ui/primitives/button';
import { useScrollFade } from '../../ui/lib/scroll-fade';
import { Panel, PanelHeader } from '../../ui/panel/panel';
import { cn } from '../../ui/lib/utils';
import { defaultTemplate } from '../app-schema';
import { LayerSwatch } from '../property-control';

export function InspectorCard({ className }: { className?: string }) {
  const fade = useScrollFade<HTMLDivElement>();
  const inspect = useAppState((s) => s.inspect);
  const inspected = useAppState((s) => s.inspected);
  const layers = useAppState((s) => s.style.layers);
  if (!inspect) return null;

  return (
    <Panel className={cn('max-h-[46vh] w-[340px]', className)}>
      <PanelHeader title={t('Inspektor')} icon={<ScanSearch className="size-3.5 text-inspect" />}>
        <IconButton label={t('Inspektor schließen')} onClick={() => store.setUi({ inspect: false, inspected: null })}>
          <X />
        </IconButton>
      </PanelHeader>
      <div ref={fade} className="min-h-0 flex-1 overflow-y-auto border-t border-ink/[0.06] px-2 py-2">
        {!inspected ? (
          <p className="px-1 py-2 text-2xs text-muted">{t('Klick auf die Karte, um zu sehen, welche Ebenen dort zeichnen.')}</p>
        ) : !inspected.length ? (
          <p className="px-1 py-2 text-2xs text-muted">{t('An dieser Stelle zeichnet keine Ebene.')}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {inspected.map((feature) => {
              const layer = layers.find((l) => l.id === feature.layerId);
              const props = Object.entries(feature.properties).slice(0, 10);
              return (
                <li key={feature.layerId} className="rounded-lg bg-ink/[0.03] p-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => store.setUi({ selectedId: feature.layerId })}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs font-medium hover:text-accent"
                    >
                      {layer ? <LayerSwatch layer={layer} /> : null}
                      <span className="truncate">{feature.layerId}</span>
                    </button>
                    <span className="shrink-0 text-[10px] text-subtle">{layer ? groupLabel(groupOf(layer)) : ''}</span>
                    <IconButton
                      size="sm"
                      label={t('Tooltip für diese Ebene anlegen')}
                      onClick={() => {
                        store.editTooltips((c) => ({
                          ...c,
                          layers: { ...c.layers, [feature.layerId]: c.layers[feature.layerId] ?? { enabled: true, template: defaultTemplate() } },
                        }));
                        store.setUi({ selectedId: feature.layerId });
                      }}
                    >
                      <MessageSquarePlus />
                    </IconButton>
                  </div>
                  {props.length ? (
                    <dl className="m-0 mt-1.5 grid grid-cols-[minmax(0,96px)_minmax(0,1fr)] gap-x-2 gap-y-0.5 font-mono text-[10px]">
                      {props.map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="truncate text-subtle" title={key}>
                            {key}
                          </dt>
                          <dd className="m-0 truncate text-muted" title={String(value)}>
                            {String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
