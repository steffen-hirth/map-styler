// In-app replacements for window.confirm/prompt, styled like the rest of the UI.
// Call confirmDialog()/promptDialog() from anywhere; <DialogHost /> renders them.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { t } from '../../i18n';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';

type DialogRequest = {
  kind: 'confirm' | 'prompt';
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  defaultValue?: string;
  placeholder?: string;
  resolve: (value: string | null) => void;
};

let current: DialogRequest | null = null;
const listeners = new Set<() => void>();

function show(request: DialogRequest) {
  // A new dialog cancels one that is still open.
  current?.resolve(null);
  current = request;
  for (const listener of listeners) listener();
}

function close(value: string | null) {
  const request = current;
  current = null;
  for (const listener of listeners) listener();
  request?.resolve(value);
}

type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string };

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => show({ ...options, kind: 'confirm', resolve: (value) => resolve(value !== null) }));
}

type PromptOptions = ConfirmOptions & { defaultValue?: string; placeholder?: string };

export function promptDialog(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => show({ ...options, kind: 'prompt', resolve }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function DialogHost() {
  const request = useSyncExternalStore(subscribe, () => current);
  if (!request) return null;
  return <DialogCard key={`${request.kind}-${request.title}`} request={request} />;
}

function DialogCard({ request }: { request: DialogRequest }) {
  const [value, setValue] = useState(request.defaultValue ?? '');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = () => close(request.kind === 'prompt' ? value.trim() : '');

  useEffect(() => {
    if (request.kind === 'prompt') {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      confirmRef.current?.focus();
    }
    // Capture phase so global shortcuts (e.g. Escape to deselect) do not also fire.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [request.kind]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && close(null)}
    >
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={request.message ? 'dialog-message' : undefined}
        className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl border border-ink/[0.08] bg-popover p-5 text-foreground shadow-[0_1px_2px_rgba(31,35,40,0.04),0_24px_56px_-20px_rgba(31,35,40,0.35)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (request.kind === 'prompt' && !value.trim()) return;
          submit();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <h2 id="dialog-title" className="m-0 text-xs-plus font-semibold tracking-[-0.01em]">
            {request.title}
          </h2>
          {request.message ? (
            <p id="dialog-message" className="m-0 text-xs leading-relaxed text-muted">
              {request.message}
            </p>
          ) : null}
        </div>
        {request.kind === 'prompt' ? (
          <Input
            ref={inputRef}
            value={value}
            placeholder={request.placeholder}
            aria-label={request.title}
            spellCheck={false}
            className="font-mono text-[12px]"
            onChange={(e) => setValue(e.target.value)}
          />
        ) : null}
        <div className="flex justify-start gap-2">
          <Button type="button" onClick={() => close(null)}>
            {request.cancelLabel ?? t('Abbrechen')}
          </Button>
          <Button ref={confirmRef} type="submit" variant="primary" disabled={request.kind === 'prompt' && !value.trim()}>
            {request.confirmLabel ?? t('OK')}
          </Button>
        </div>
      </form>
    </div>
  );
}
