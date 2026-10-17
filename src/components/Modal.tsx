import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Id of the element that names the dialog, for `aria-labelledby`. */
  labelledBy: string;
  /** Panel width class, so a picker and a short naming form need not look identical. */
  widthClassName?: string;
  children: React.ReactNode;
}

/**
 * The popup shell both studio dialogs sit in: a scrim over the page, a panel portalled to
 * `document.body`, and the dismissal rules written once.
 *
 * Portal rather than an absolutely positioned div so no card, sticky rail or `overflow:
 * hidden` ancestor can clip the panel. Escape and a press on the scrim itself close it —
 * a press that starts inside the panel and drags out does not, which is what a text
 * selection in the naming field feels like. Page scroll is locked while it is up and
 * restored on close, because a background page that scrolls under a dialog reads as broken.
 *
 * Focus moves into the panel on open; the caller owns returning it to whatever opened the
 * dialog, so it can point at the right trigger.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  labelledBy,
  widthClassName = 'max-w-[420px]',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // The close handler changes identity every parent render; reading it through a ref keeps
  // the listeners tied to `open` alone. Otherwise a re-render while the popup is up (say,
  // switching the instrument) tore the effect down and re-ran it, yanking focus off
  // whichever control the user was on.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(0,0,0,0.62)] p-4 backdrop-blur-[2px]"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`glass-card max-h-[90vh] w-full overflow-y-auto outline-none ${widthClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
