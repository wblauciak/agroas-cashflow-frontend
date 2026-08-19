import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

export function InfoTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Więcej informacji"
            className="inline-flex text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <Info size={13} strokeWidth={2} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-50 max-w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs leading-relaxed text-slate-100 shadow-lg dark:bg-slate-100 dark:text-slate-900"
          >
            {children}
            <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
