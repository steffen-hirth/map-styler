import { useMemo, useRef, useState } from 'react';
import { useScrollFade } from '../../ui/lib/scroll-fade';
import { store, useAppState } from '../../runtime/state/store';
import { colorKey } from '../../runtime/style/color';
import { t } from '../../i18n';
import { GROUPS, groupLabel, type GroupId } from '../../runtime/style/spec';
import { collectPalette, replaceColor, type PaletteEntry } from '../../runtime/style/style-utils';
import { ColorControl } from '../../ui/controls/color-control';
import { NativeSelect } from '../../ui/primitives/input';
import { cn } from '../../ui/lib/utils';

export function PalettePanel() {
  const fade = useScrollFade<HTMLUListElement>();
  // The committed style keeps the list stable while a color is being dragged.
  const committed = useAppState((s) => s.committed);
  const [group, setGroup] = useState<GroupId | ''>('');
  const entries = useMemo(() => collectPalette(committed, group), [committed, group]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-3 pt-2 pb-3">
        <NativeSelect value={group} aria-label={t('Gruppe')} onChange={(e) => setGroup(e.target.value as GroupId | '')}>
          <option value="">{t('Alle Ebenen')}</option>
          {GROUPS.map(([id]) => (
            <option key={id} value={id}>
              {groupLabel(id)}
            </option>
          ))}
        </NativeSelect>
        <p className="text-[10px] leading-relaxed text-subtle">
          {group
            ? t('{n} Farben. Eine Änderung ersetzt die Farbe überall in „{group}“.', { n: entries.length, group: groupLabel(group) })
            : t('{n} Farben. Eine Änderung ersetzt die Farbe überall, wo sie vorkommt.', { n: entries.length })}
        </p>
      </div>
      <ul ref={fade} className="m-0 min-h-0 flex-1 list-none overflow-y-auto overscroll-contain border-t border-ink/[0.06] p-0">
        {entries.map((entry) => (
          <PaletteRow key={entry.key} entry={entry} />
        ))}
      </ul>
    </div>
  );
}

function PaletteRow({ entry }: { entry: PaletteEntry }) {
  const currentKey = useRef(entry.key);
  const [open, setOpen] = useState(false);
  return (
    <li className="flex flex-col gap-1.5 border-b border-ink/[0.04] px-3 py-2.5">
      <ColorControl
        value={entry.color}
        label={t('Palettenfarbe')}
        onChange={(value, live) => {
          const nextKey = colorKey(value);
          if (!nextKey) return;
          const fromKey = currentKey.current;
          store.edit((s) => replaceColor(s, entry.refs, fromKey, value), live);
          currentKey.current = nextKey;
        }}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="self-start text-left text-[10px] text-subtle hover:text-muted"
        aria-expanded={open}
      >
        {entry.layerIds.length === 1 ? t('1 Ebene') : t('{n} Ebenen', { n: entry.layerIds.length })} · {entry.groups.map((g) => groupLabel(g)).join(', ')}
      </button>
      {open ? (
        <div className="flex flex-wrap gap-1">
          {entry.layerIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => store.setUi({ selectedId: id })}
              className={cn('rounded bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-muted hover:bg-accent/20 hover:text-foreground')}
            >
              {id}
            </button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
