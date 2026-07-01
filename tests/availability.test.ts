import assert from "node:assert/strict";
import test from "node:test";
import { buildAvailabilityOverrideWhere, resolveAvailabilityOverride } from "../src/routes/availability.ts";

test("calendar availability overrides weekly availability", () => {
  assert.equal(resolveAvailabilityOverride(false, true), false);
  assert.equal(resolveAvailabilityOverride(true, false), true);
  assert.equal(resolveAvailabilityOverride(undefined, true), true);
  assert.equal(resolveAvailabilityOverride(undefined, undefined), false);
});

test("availability query only falls back to weekly when no calendar row exists", () => {
  const dateOnly = new Date("2026-07-01T00:00:00.000Z");

  assert.deepEqual(buildAvailabilityOverrideWhere(dateOnly, 3), {
    OR: [
      { teacherAvailabilityCalendar: { some: { date: dateOnly, isAvailable: true } } },
      {
        AND: [
          { teacherAvailabilityCalendar: { none: { date: dateOnly } } },
          { teacherWeeklyAvailability: { some: { dayOfWeek: 3, isAvailable: true } } }
        ]
      }
    ]
  });
});
