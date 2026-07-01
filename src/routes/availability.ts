export function buildAvailabilityOverrideWhere(dateOnly: Date, dayOfWeek: number) {
  return {
    OR: [
      { teacherAvailabilityCalendar: { some: { date: dateOnly, isAvailable: true } } },
      {
        AND: [
          { teacherAvailabilityCalendar: { none: { date: dateOnly } } },
          { teacherWeeklyAvailability: { some: { dayOfWeek, isAvailable: true } } }
        ]
      }
    ]
  };
}

export function resolveAvailabilityOverride(
  calendarAvailability: boolean | undefined,
  weeklyAvailability: boolean | undefined
): boolean {
  return calendarAvailability ?? weeklyAvailability ?? false;
}
