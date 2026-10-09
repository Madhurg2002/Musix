import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface SelectMenuOption {
  id: string;
  label: string;
}

interface SelectMenuProps {
  value: string;
  options: readonly SelectMenuOption[];
  onChange: (id: string) => void;
  /** Hover/focus hint shown as a data-tip bubble on the trigger. */
  tip?: string;
  /** Extra classes for the trigger (responsive sizing from the host layout). */
  className?: string;
  /** Accessible name when no visible label wraps the trigger. */
  ariaLabel?: string;
}

interface PopupPos {
  left: number;
  top: number;
  width: number;
}

/** Estimated height of one option row — only used to pick the popup's side. */
const ROW_HEIGHT = 40;
const GAP = 6;

/**
 * A themed replacement for the native `<select>` popup.
 *
 * The trigger keeps the shared `.select-input` look, but the open menu is drawn in the
 * app's own tokens and portalled to `document.body`, so the navigation rail's overflow
 * can never clip it. Native option menus are OS chrome — browsers ignore author styles
 * there — which is why they rendered in system colours next to this theme.
 *
 * Keyboard: Enter/Space/ArrowDown open, arrows move, Enter selects, Escape closes; focus
 * returns to the trigger. Click or focus outside closes.
 */
export const SelectMenu: React.FC<SelectMenuProps> = ({
  value,
  options,
  onChange,
  tip,
  className = '',
  ariaLabel,
}) => {
  const baseId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(0, options.findIndex((option) => option.id === value))
  );
  const [pos, setPos] = useState<PopupPos | null>(null);

  const selected = options.find((option) => option.id === value) ?? options[0];

  // Re-anchored on every scroll/resize while open, so the menu tracks the trigger.
  const reposition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimated = options.length * ROW_HEIGHT + 10;
    const fitsBelow = window.innerHeight - rect.bottom >= estimated + GAP;
    const top = fitsBelow
      ? rect.bottom + GAP
      : Math.max(GAP, rect.top - estimated - GAP);
    setPos({ left: rect.left, top, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    reposition();
    // focusin (not click) so tabbing away also dismisses the menu.
    const onDocPointer = (event: Event) => {
      const target = event.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('focusin', onDocPointer);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    listRef.current?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('focusin', onDocPointer);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
    // `reposition` only reads refs and `options.length`, both current while open.
  }, [open, options.length]);

  const openMenu = (startBelow?: number) => {
    setActive(
      startBelow !== undefined
        ? startBelow
        : Math.max(0, options.findIndex((option) => option.id === value))
    );
    setOpen(true);
  };

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((prev) => (prev + step + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[active];
      if (option) pick(option.id);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`select-input flex cursor-pointer items-center justify-between gap-2 text-left ${className}`}
        data-tip={tip}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            openMenu(event.key === 'ArrowDown' ? 0 : options.length - 1);
          }
        }}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <span
          className={`inline-flex shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            aria-activedescendant={`${baseId}-opt-${options[active]?.id ?? ''}`}
            tabIndex={-1}
            className="fixed z-[200] max-h-[min(60vh,320px)] overflow-y-auto rounded-[10px] border border-hairline bg-surface p-1.5 shadow-[var(--elev-2)] outline-none backdrop-blur-[14px]"
            style={{ left: pos.left, top: pos.top, minWidth: pos.width }}
            onKeyDown={onKeyDown}
          >
            {options.map((option, index) => {
              const isSelected = option.id === value;
              const isActive = index === active;
              return (
                <div
                  key={option.id}
                  id={`${baseId}-opt-${option.id}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[linear-gradient(135deg,var(--accent-primary)_0%,#c98a3f_100%)] font-bold text-black shadow-[0_0_12px_var(--accent-primary)]'
                      : isActive
                        ? 'bg-[rgba(var(--accent-rgb),0.16)] font-semibold text-ink'
                        : 'font-semibold text-ink-soft hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-ink'
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(option.id)}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <span className="inline-flex" aria-hidden="true">
                      <Icon name="check" size={13} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
};
