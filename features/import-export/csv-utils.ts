export type CsvRecord = Record<string, string>;

export function parseCsvText(text: string) {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return { headers: [] as string[], records: [] as CsvRecord[] };
  }

  const headers = rows[0].map((header) => normalizeHeader(header));
  const records = rows.slice(1).filter((row) => !isBlankRow(row)).map((row) => toCsvRecord(headers, row));

  return { headers, records };
}

export function serializeCsv(headers: string[], records: Array<Record<string, string | number | boolean | null | undefined>>) {
  const rows = [headers];

  for (const record of records) {
    rows.push(headers.map((header) => formatCsvValue(record[header])));
  }

  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n") + "\r\n";
}

export function parseCsvRows(text: string) {
  const input = text.startsWith("\ufeff") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let index = 0;
  let inQuotes = false;

  while (index < input.length) {
    const char = input[index];

    if (inQuotes) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }

        inQuotes = false;
        index += 1;
        continue;
      }

      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      index += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      index += 1;
      continue;
    }

    if (char === "\r" || char === "\n") {
      if (char === "\r" && input[index + 1] === "\n") {
        index += 1;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += 1;
      continue;
    }

    field += char;
    index += 1;
  }

  row.push(field);
  if (!isBlankRow(row)) {
    rows.push(row);
  }

  return rows;
}

function toCsvRecord(headers: string[], row: string[]) {
  const record: CsvRecord = {};

  headers.forEach((header, index) => {
    if (header) {
      record[header] = normalizeCell(row[index] ?? "");
    }
  });

  return record;
}

function normalizeHeader(value: string) {
  return normalizeCell(value);
}

function normalizeCell(value: string) {
  return value.replace(/^\uFEFF/, "").trim();
}

function isBlankRow(row: string[]) {
  return row.every((cell) => normalizeCell(cell).length === 0);
}

function formatCsvValue(value: string | number | boolean | null | undefined) {
  if (value == null) {
    return "";
  }

  return String(value);
}

function escapeCsvValue(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
