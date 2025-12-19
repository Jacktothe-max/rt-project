function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Phase 1 placeholder: deterministic postcode -> lat/lng mapping.
 * Replace with real geocoding later. Intentionally not country-specific.
 */
export function fakeGeocode(postcode: string, salt = ""): { latitude: number; longitude: number } {
  const h1 = hashString(`${postcode}|${salt}|lat`);
  const h2 = hashString(`${postcode}|${salt}|lng`);

  // Keep away from poles for nicer map UX.
  const lat = ((h1 % 120000) / 1000 - 60); // [-60..60]
  const lng = ((h2 % 360000) / 1000 - 180); // [-180..180]
  return { latitude: lat, longitude: lng };
}


