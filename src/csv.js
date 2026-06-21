export function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      row.push(cell.trim());
      if (row.some(value => value !== '')) {
        rows.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some(value => value !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

export function normalizeHeader(header) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getHeaderIndex(normalizedHeaders, headerKey, fallbackLabel) {
  const idx = normalizedHeaders.findIndex(header => header === headerKey);
  if (idx === -1) {
    throw new Error('Missing required column: ' + fallbackLabel);
  }
  return idx;
}

export function getOptionalHeaderIndex(normalizedHeaders, ...headerKeys) {
  const idx = normalizedHeaders.findIndex(header => headerKeys.includes(header));
  return idx === -1 ? undefined : idx;
}
