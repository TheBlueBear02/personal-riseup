/**
 * Convert a spreadsheet column letter to a 0-based array index.
 * A → 0, B → 1, … Z → 25, AA → 26, …
 */
export function colToIndex(letter: string): number {
  const normalized = letter.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) {
    throw new Error(`Invalid column letter: ${letter}`);
  }

  let index = 0;
  for (const char of normalized) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}
