export function normalizeLabel(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
}
export function matchesLabel(label: string, query: string): boolean {
  const text = normalizeLabel(label);
  return normalizeLabel(query).split(/\s+/).filter(Boolean).every(part => text.includes(part));
}
