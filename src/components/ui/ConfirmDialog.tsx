import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  name: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({ name, busy = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
    if (!items?.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return <div className="contacts-overlay contacts-overlay--confirm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section ref={dialogRef} className="contacts-confirm confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description" onKeyDown={handleKeyDown}>
      <span className="contacts-confirm__icon"><Trash2 size={20} aria-hidden="true" /></span>
      <h2 id="confirm-dialog-title">Подтвердите удаление</h2>
      <p id="confirm-dialog-description">Удалить «{name}»? Это действие нельзя будет отменить.</p>
      <div className="contacts-confirm__actions">
        <button ref={cancelRef} className="secondary-button" type="button" onClick={onCancel} disabled={busy}>Отмена</button>
        <button className="danger-button" type="button" onClick={() => void onConfirm()} disabled={busy}>{busy ? 'Удаляем…' : 'Удалить'}</button>
      </div>
    </section>
  </div>;
}
