import { Download, Redo2, ScanSearch, Undo2 } from 'lucide-react';
import { t } from '../i18n';
import { store, useAppState } from '../runtime/state/store';
import { Button, IconButton } from '../ui/primitives/button';
import { Panel } from '../ui/panel/panel';
import { cn } from '../ui/lib/utils';
import { useUiMode } from './ui-mode';

const Divider = () => <span className="mx-0.5 h-4 w-px bg-ink/[0.1]" aria-hidden />;

/** Actions only; starting points (templates, base styles, import) live in the Templates tab. */
export function Toolbar({ className }: { className?: string }) {
  const canUndo = useAppState((s) => s.canUndo);
  const canRedo = useAppState((s) => s.canRedo);
  const inspect = useAppState((s) => s.inspect);
  const expert = useUiMode() === 'expert';

  return (
    <Panel className={cn('flex-row items-center gap-1 rounded-[14px] p-1.5 [&_button]:rounded-lg', className)}>
      <IconButton label={t('Rückgängig (⌘Z)')} disabled={!canUndo} onClick={() => store.undo()}>
        <Undo2 />
      </IconButton>
      <IconButton label={t('Wiederholen (⇧⌘Z)')} disabled={!canRedo} onClick={() => store.redo()}>
        <Redo2 />
      </IconButton>
      <Divider />
      {expert ? (
        <Button
          variant="ghost"
          active={inspect}
          className="data-[active=true]:bg-inspect/15 data-[active=true]:text-inspect"
          onClick={() => store.setUi({ inspect: !inspect, inspected: null })}
        >
          <ScanSearch /> {t('Inspektor')}
        </Button>
      ) : null}
      <Button variant="primary" onClick={() => store.setUi({ exportOpen: true })}>
        <Download /> {t('Exportieren')}
      </Button>
    </Panel>
  );
}
