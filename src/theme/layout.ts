export const radii = {
  sm: 14,
  md: 18,
  lg: 20,
  xl: 24,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

/**
 * Soft card lift instead of a hard border. Spread this and set
 * `shadowColor: colors.textPrimary` per-screen so it adapts to the theme.
 */
export const cardShadow = {
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 3,
} as const;

export type TimeOfDay = 'morning' | 'midday' | 'evening';

/** Buckets a scheduled hour into morning/midday/evening for time-of-day color coding. */
export function timeOfDay(dateIso: string): TimeOfDay {
  const hour = new Date(dateIso).getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'midday';
  return 'evening';
}
