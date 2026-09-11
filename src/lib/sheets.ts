import Papa from 'papaparse';

/** A cell showing a raw spreadsheet formula-error token (e.g. a "+49…" phone number Sheets misread as a formula). */
const SHEET_ERROR_PATTERN = /^#(ERROR!|REF!|VALUE!|N\/A|NULL!|NUM!|DIV\/0!|NAME\?)$/;

/**
 * Fetches one tab of the public Google Sheet as CSV and parses it into
 * plain objects keyed by header row. Build-time only (Node `fetch`) — the
 * sheet must be shared as "Anyone with the link can view" or published to
 * the web; no API key or service account needed.
 */
export async function fetchSheetTab(tabName: string): Promise<Record<string, string>[]> {
  const sheetId = import.meta.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID is not set. Required to fetch content at build time.');
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch sheet tab "${tabName}" (${response.status}). ` +
        'Make sure the sheet is shared as "Anyone with the link can view" or published to the web.'
    );
  }

  const csv = await response.text();
  const { data, errors } = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => {
      const trimmed = value.trim();
      return SHEET_ERROR_PATTERN.test(trimmed) ? '' : trimmed;
    },
  });

  if (errors.length > 0) {
    throw new Error(`Failed to parse sheet tab "${tabName}": ${errors[0].message}`);
  }

  return data;
}

/** Splits a comma-separated cell into a trimmed, non-empty string array. */
export function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['true', 'wahr', 'ja', 'yes', '1', 'x'].includes(value.trim().toLowerCase());
}
