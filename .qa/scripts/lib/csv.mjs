// Minimal RFC 4180 CSV reader and writer. No dependencies.
// Reads files saved by Excel, Google Sheets, Numbers or LibreOffice (BOM, CRLF, quoted newlines).

const BOM = String.fromCharCode(0xfeff);

export function parseCsv(text) {
  const s = text.charCodeAt(0) === BOM.charCodeAt(0) ? text.slice(1) : text;
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

// Rows as objects keyed by the header row (header names trimmed and lower-cased).
// _row is the spreadsheet row number (the header is row 1).
export function readRecords(text) {
  const [header = [], ...rows] = parseCsv(text);
  const keys = header.map((h) => h.trim().toLowerCase());
  return {
    columns: keys,
    records: rows.map((r, i) => {
      const o = { _row: i + 2 };
      keys.forEach((k, j) => {
        o[k] = (r[j] ?? "").replace(/\r\n/g, "\n").trim();
      });
      return o;
    }),
  };
}

const cell = (v) => {
  const t = v === undefined || v === null ? "" : String(v);
  return /[",\n\r]/.test(t) || /^\s|\s$/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

// UTF-8 with a BOM so Excel shows symbols like × and Rs correctly; other tools ignore it.
export function writeCsv(columns, records) {
  const lines = [columns.map(cell).join(",")];
  for (const r of records) lines.push(columns.map((c) => cell(r[c])).join(","));
  return BOM + lines.join("\n") + "\n";
}
