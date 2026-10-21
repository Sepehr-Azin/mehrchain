// Exact defaults supplied by earlier onboarding versions. Keep stored values,
// but do not present them as a deliberately entered personal Why.
const suppliedReasons = new Set([
  'to prove to myself small steps matter',
  'to prove to myself that small steps matter',
]);

export function personalMotivation(value: string | null | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  const comparable = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!]+$/, '');
  return suppliedReasons.has(comparable) ? null : text;
}
