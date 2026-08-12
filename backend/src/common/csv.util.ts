function escapeCsvField(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(row[c.key])).join(','),
  );
  return [headerLine, ...lines].join('\r\n');
}
