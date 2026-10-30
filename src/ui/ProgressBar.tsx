import { Progress } from '@base-ui/react/progress';
import { cx } from './focus';

export type ProgressBarProps = {
  // 0 to 1.
  value: number;
  // What it counts, for screen readers ("Land painted").
  label: string;
  // Layout only.
  className?: string;
};

// A small leaf-green bar, usually inside a chip next to its number.
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  return (
    <Progress.Root
      value={value * 100}
      aria-label={label}
      render={<span />}
      className={cx('block h-3 w-20 overflow-hidden rounded-pill border-2 border-outline bg-surface-sunk', className)}
    >
      <Progress.Indicator render={<span />} className="block h-full bg-leaf-500 transition-[width] duration-(--dur-pop) motion-reduce:transition-none" />
    </Progress.Root>
  );
}
