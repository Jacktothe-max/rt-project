import assert from "node:assert/strict";
import test from "node:test";
import { hasEffectiveAvailability } from "./availability.ts";

test("calendar availability overrides weekly availability", () => {
  assert.equal(hasEffectiveAvailability([{ isAvailable: false }], [{ isAvailable: true }]), false);
  assert.equal(hasEffectiveAvailability([{ isAvailable: true }], [{ isAvailable: false }]), true);
});

test("weekly availability is used when no calendar entry exists", () => {
  assert.equal(hasEffectiveAvailability([], [{ isAvailable: true }]), true);
  assert.equal(hasEffectiveAvailability([], [{ isAvailable: false }]), false);
  assert.equal(hasEffectiveAvailability([], []), false);
});
