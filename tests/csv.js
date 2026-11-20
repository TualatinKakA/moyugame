export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field); field = ''; }
    else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += character;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = (rows.shift() || []).map((header, index) => index === 0 ? header.replace(/^\uFEFF/, '') : header);
  return rows.filter(row => row.some(value => value !== '')).map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}
