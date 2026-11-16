import { cn } from '@/lib/cn';

export type NumberLabelProps = {
  /** 1 renders `01`. A string is rendered as given. */
  n: number | string;
  className?: string;
  /** Pass true when the number repeats what an ordered list already announces. */
  'aria-hidden'?: boolean;
};

/** The 01 to 05 label of a service or a step: salmon, tabular figures (DESIGN.md 4). */
export function NumberLabel({ n, className, 'aria-hidden': ariaHidden }: NumberLabelProps) {
  const text = typeof n === 'number' ? String(n).padStart(2, '0') : n;
  return (
    <span className={cn('ui-num', className)} aria-hidden={ariaHidden}>
      {text}
    </span>
  );
}
