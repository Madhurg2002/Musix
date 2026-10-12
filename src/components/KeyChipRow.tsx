import React from 'react';
import { NoteName } from '../types';
import { ChipRow, type ChipOption } from './ChipRow';
import { type ScreenContext } from '../routes';
import { readPreference, writePreference, PREFERENCE_KEYS, isOneOf, isNoteName } from '../utils/preferences';

const PRACTICE_KEYS = ['C', 'G', 'D', 'A', 'E', 'F'] as const satisfies readonly NoteName[];
const isNote = isOneOf<NoteName>(...PRACTICE_KEYS);

export function KeyChipRow({ context }: { context: ScreenContext }) {
  const selectedRoot = context.selectedRoot;
  const setSelectedRoot = context.setSelectedRoot;

  const value = readPreference(PREFERENCE_KEYS.root, selectedRoot, isNote) ?? selectedRoot;
  const options: readonly ChipOption<NoteName>[] = PRACTICE_KEYS.map((key) => ({
    value: key,
    label: key,
    tip: `Practise in the key of ${key} — every tool follows it`,
  }));

  const handleChange = (next: NoteName) => {
    setSelectedRoot(next);
    writePreference(PREFERENCE_KEYS.root, next);
  };

  return (
    <ChipRow
      label="Key"
      options={options}
      value={value}
      onChange={handleChange}
    />
  );
}
