import React, { useState } from 'react';
import { ROUTES, type NavGroupLabel } from '../routes';
import { THEMES, applyTheme, readTheme, type ThemeId } from '../utils/theme';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedVisualizer: 'piano' | 'guitar';
  setSelectedVisualizer: (visualizer: 'piano' | 'guitar') => void;
}

const GROUP_ORDER: NavGroupLabel[] = ['Practice', 'Fretboard', 'Harmony', 'Learn', 'Project'];

const GROUP_LABELS: Record<NavGroupLabel, string> = {
  Practice: 'Practice',
  Fretboard: 'Fretboard',
  Harmony: 'Harmony',
  Learn: 'Learn',
  Project: 'Project',
};

/**
 * The rail is built from the route table, grouped by what a learner is trying to do rather
 * than dumped into one flat row, so it reads as a study plan instead of a toolbar.
 *
 * Below 900px it flips into a horizontal, scrolling top bar: the `max-[900px]:` variants
 * carry that second layout, and the group labels and hints drop out to leave tappable chips.
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedVisualizer,
  setSelectedVisualizer,
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => readTheme());

  // Piano and Fretboard are two views of the same idea, so only the selected one is listed.
  const visibleRoutes = ROUTES.filter(
    (route) => !route.visibleFor || route.visibleFor === selectedVisualizer
  );

  const handleThemeChange = (value: string) => {
    const next = value as ThemeId;
    setTheme(next);
    applyTheme(next);
  };

  return (
    <nav
      className="print:hidden sticky top-0 flex h-screen w-[236px] shrink-0 grow-0 flex-col gap-5 self-start overflow-y-auto border-r border-hairline bg-[linear-gradient(180deg,rgba(var(--bg-secondary-rgb),0.97)_0%,rgba(var(--bg-primary-rgb),0.97)_100%)] backdrop-blur-[18px] [padding:20px_14px] max-[900px]:z-[70] max-[900px]:h-auto max-[900px]:w-full max-[900px]:basis-auto max-[900px]:flex-row max-[900px]:items-center max-[900px]:gap-2.5 max-[900px]:overflow-x-auto max-[900px]:overflow-y-hidden max-[900px]:self-auto max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:[-webkit-overflow-scrolling:touch] max-[900px]:[padding:max(10px,env(safe-area-inset-top))_12px_10px]"
      aria-label="Musix sections"
    >
      <div className="px-2 pt-0.5 max-[700px]:basis-full max-[700px]:justify-center">
        <span
          className="text-[32px] text-accent drop-shadow-[0_0_10px_var(--accent-primary)]"
          aria-hidden="true"
        >
          ♫
        </span>
        <div className="max-[900px]:hidden">
          <h1 className="brand-wordmark text-[24px] font-extrabold tracking-[-0.5px]">
            Musix
          </h1>
          <p className="text-[13px] text-ink-soft">Analog studio for theory</p>
        </div>
      </div>

      <div className="flex flex-col gap-[18px] max-[900px]:flex-row max-[900px]:items-center max-[900px]:gap-1">
        {GROUP_ORDER.map((group) => {
          const items = visibleRoutes.filter((route) => route.group === group);
          if (items.length === 0) return null;

          return (
            <div
              className="flex flex-col gap-[3px] max-[900px]:flex-row max-[900px]:items-center max-[900px]:gap-1"
              key={group}
            >
              <span className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted max-[900px]:hidden">
                {GROUP_LABELS[group]}
              </span>
              {items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full cursor-pointer flex-col items-start gap-px border-l-2 bg-transparent px-3 py-2 text-left font-sans transition-[background-color,color,border-color] duration-[180ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:bg-[rgba(var(--overlay-rgb),0.05)] [border-radius:0_var(--radius-sm)_var(--radius-sm)_0] max-[900px]:flex-row max-[900px]:w-auto max-[900px]:min-h-10 max-[900px]:justify-center max-[900px]:whitespace-nowrap max-[900px]:border-l-0 max-[900px]:border-b-2 max-[900px]:px-3 max-[900px]:py-[7px] max-[900px]:[border-radius:var(--radius-sm)] ${
                      isActive
                        ? 'border-l-accent bg-[linear-gradient(90deg,rgba(var(--accent-rgb),0.18)_0%,rgba(var(--accent-rgb),0.02)_100%)] text-ink max-[900px]:border-b-accent max-[900px]:bg-[rgba(var(--accent-rgb),0.14)]'
                        : 'border-l-transparent text-ink-soft hover:text-ink max-[900px]:border-b-transparent'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    data-tip={`${item.label} — ${item.hint}`}
                    data-tip-pos="right"
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="text-[14px] font-semibold leading-[1.25]">{item.label}</span>
                    <span
                      className={`text-[11px] max-[900px]:hidden ${
                        isActive ? 'text-ink-soft' : 'text-ink-muted'
                      }`}
                    >
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-hairline pt-4 max-[900px]:ml-auto max-[900px]:mt-0 max-[900px]:flex-row max-[900px]:border-t-0 max-[900px]:pt-0">
        <label className="flex w-full flex-col gap-1 max-[900px]:w-auto max-[900px]:flex-row max-[900px]:items-center">
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted">
            Theme
          </span>
          <select
            className="select-input w-full max-w-full max-[900px]:w-auto max-[900px]:max-w-[140px]"
            value={theme}
            title="Studio theme — repaints every screen at once"
            onChange={(event) => handleThemeChange(event.target.value)}
          >
            {THEMES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div
          className="flex shrink-0 flex-col items-start gap-1.5 max-[900px]:flex-row max-[900px]:items-center max-[700px]:basis-full max-[700px]:justify-center"
          role="group"
          aria-label="Choose visualizer"
        >
          <span className="text-[11px] font-bold text-ink-muted">Visualizer</span>
          <div className="inline-flex gap-0.5 rounded-[6px] border border-hairline bg-[rgba(var(--inset-rgb),0.32)] p-[3px]">
            <button
              type="button"
              aria-pressed={selectedVisualizer === 'piano'}
              className={`min-h-8 cursor-pointer rounded-[4px] border-0 px-2.5 font-sans text-[12px] font-bold ${
                selectedVisualizer === 'piano'
                  ? 'bg-accent text-[color:var(--bg-primary)]'
                  : 'bg-transparent text-ink-soft hover:text-ink'
              }`}
              onClick={() => setSelectedVisualizer('piano')}
            >
              Piano
            </button>
            <button
              type="button"
              aria-pressed={selectedVisualizer === 'guitar'}
              className={`min-h-8 cursor-pointer rounded-[4px] border-0 px-2.5 font-sans text-[12px] font-bold ${
                selectedVisualizer === 'guitar'
                  ? 'bg-accent text-[color:var(--bg-primary)]'
                  : 'bg-transparent text-ink-soft hover:text-ink'
              }`}
              onClick={() => setSelectedVisualizer('guitar')}
            >
              Guitar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
