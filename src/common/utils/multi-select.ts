export function splitMultiSelectValues(value: string): string[] {
  const values: string[] = [];
  const seen = new Set<string>();
  for (const part of value.split(/[、,，;；/／\r\n]+/u)) {
    const normalized = part.trim();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      values.push(normalized);
    }
  }
  return values;
}
