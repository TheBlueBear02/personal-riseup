import "server-only";

import { google } from "googleapis";
import { ERAS } from "@/eras.config";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

export type SheetValuesByTab = Record<string, unknown[][]>;

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY env var");
  }
  try {
    return JSON.parse(raw) as {
      client_email: string;
      private_key: string;
      [key: string]: unknown;
    };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
  }
}

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) {
    throw new Error("Missing GOOGLE_SPREADSHEET_ID env var");
  }
  return id;
}

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SPREADSHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  );
}

/** Collect unique tab names from all eras. */
export function getAllTabNames(): string[] {
  const names = new Set<string>();
  for (const era of ERAS) {
    names.add(era.assets.tab);
    names.add(era.incomeExpenses.tab);
  }
  return [...names];
}

/**
 * Fetch full used ranges for all era tabs in one batchGet call.
 * Amounts come back as raw numbers; dates as FORMATTED_STRING.
 */
export async function fetchAllTabs(): Promise<SheetValuesByTab> {
  const credentials = getCredentials();
  const spreadsheetId = getSpreadsheetId();
  const tabNames = getAllTabNames();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: tabNames,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const result: SheetValuesByTab = {};
  for (const tab of tabNames) {
    result[tab] = [];
  }

  const valueRanges = response.data.valueRanges ?? [];
  for (let i = 0; i < tabNames.length; i++) {
    const tab = tabNames[i];
    const rows = valueRanges[i]?.values ?? [];
    result[tab] = rows as unknown[][];
  }

  return result;
}
