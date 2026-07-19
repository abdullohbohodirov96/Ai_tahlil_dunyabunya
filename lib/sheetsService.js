import { google } from "googleapis";
import { getSetting } from "./settings.js";

export async function fetchLeadsFromSheet() {
  const rawKey = await getSetting("google_service_account_json", "GOOGLE_SERVICE_ACCOUNT_JSON");
  const sheetId = await getSetting("google_sheet_id", "SALES_SHEET_ID");
  const range = (await getSetting("google_sheet_range", "SALES_SHEET_RANGE")) || "Leads!A2:F";

  if (!sheetId || !rawKey) {
    // DEMO REJIM — hali ulanmagan
    return [
      { rowId: "demo-1", fullName: "Aziz Aliyev", phone: "+998901112233", source: "Instagram" },
      { rowId: "demo-2", fullName: "Malika Yusupova", phone: "+998901112244", source: "Facebook" },
    ];
  }

  let credentials;
  try {
    credentials = JSON.parse(rawKey);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON noto'g'ri formatda (to'liq JSON matni bo'lishi kerak)");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const rows = resp.data.values || [];

  return rows.map((r, i) => ({
    rowId: `row-${i}-${r[2] || ""}`,
    fullName: r[1] || "Noma'lum",
    phone: r[2] || "",
    source: r[3] || "boshqa",
  }));
}
