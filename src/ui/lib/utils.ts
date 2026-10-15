import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseColor } from '../../runtime/style/color';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const CHECKER = 'conic-gradient(#e3e3e7 25%, #ffffff 0 50%, #e3e3e7 0 75%, #ffffff 0) 0 0 / 8px 8px';

/**
 * One background for a color swatch. Color and checkerboard share a single
 * layer, so no pattern bleeds through anti-aliased rounded corners; the
 * checkerboard only shows for (semi-)transparent colors.
 */
export function swatchBackground(color: string | null | undefined): string {
  const parsed = parseColor(color);
  if (!color || !parsed) return CHECKER;
  if (parsed.a >= 1) return color;
  return `linear-gradient(${color}, ${color}), ${CHECKER}`;
}
