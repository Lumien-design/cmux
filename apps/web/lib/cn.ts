import clsx, { type ClassValue } from 'clsx';

/**
 * Deliberately clsx only, with no tailwind-merge. twMerge ships a hardcoded map
 * of Tailwind's default class groups, and this project deletes the default
 * spacing scale — so it would not recognise `p-300` and `p-400` as conflicting
 * without extra configuration. Across a dozen components there is no conflict
 * problem worth that.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
