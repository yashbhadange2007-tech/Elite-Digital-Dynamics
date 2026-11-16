import { clsx, type ClassValue } from 'clsx';

/**
 * Joins class names. It does not resolve conflicts between Tailwind utilities.
 * The ui primitives are styled in `@layer components`, so a utility passed in `className` always wins.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
