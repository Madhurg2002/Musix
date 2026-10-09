import React from 'react';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  /** Tooltip text — says what the control does when pressed. */
  tip: string;
}

interface ChipRowProps<T extends string> {
  /** Small caption rendered to the left of the chips. */
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A labelled row of toggle chips (`aria-pressed`), shared by the hero's key picker and
 * the chord studio's instrument picker so both stay visually identical without copying
 * the markup — one source for the chip border, tint, and transition.
 */
export function ChipRow<T extends string>({ label, options, value, onChange }: ChipRowProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            className={`cursor-pointer rounded-xl border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
              value === option.value
                ? 'border-accent bg-accent text-[#1a1208]'
                : 'border-hairline bg-chip text-ink'
            }`}
            aria-pressed={value === option.value}
            data-tip={option.tip}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
