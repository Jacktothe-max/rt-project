export type AvailabilityEntry = { isAvailable: boolean };

export function getDayOfWeekMon1Sun7(d = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

export function toISODateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function dateOnlyUtc(d: Date): Date {
  return new Date(`${toISODateOnly(d)}T00:00:00.000Z`);
}

export function hasEffectiveAvailability(
  calendarEntries: AvailabilityEntry[] | undefined,
  weeklyEntries: AvailabilityEntry[] | undefined
): boolean {
  const calendar = calendarEntries?.[0]?.isAvailable;
  const weekly = weeklyEntries?.[0]?.isAvailable ?? false;
  return calendar ?? weekly;
}
