import { google } from "googleapis";
import { getSetting } from "./settings.js";

// Agar odam to'liq Google Sheets URL manzilini joylashtirgan bo'lsa
// ("https://docs.google.com/spreadsheets/d/XXXX/edit#gid=0"), shu yerdan
// haqiqiy ID'ni ("XXXX") avtomatik ajratib oladi.
function extractSheetId(raw) {
  if (!raw) return raw;
  const match = raw.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : raw.trim();
}

export async function fetchLeadsFromSheet() {
  const rawKey = await getSetting("google_service_account_json", "GOOGLE_SERVICE_ACCOUNT_JSON");
  const rawSheetId = await getSetting("google_sheet_id", "SALES_SHEET_ID");
  const sheetId = extractSheetId(rawSheetId);
  // Agar oraliq (range) ko'rsatilmagan bo'lsa, varaq nomini talab qilmaydigan
  // "A2:F" ishlatiladi — bu avtomatik birinchi varaqni oladi.
  const range = (await getSetting("google_sheet_range", "SALES_SHEET_RANGE")) || "A2:F";

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

  try {
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    const rows = resp.data.values || [];

    return rows.map((r, i) => ({
      rowId: `row-${i}-${r[2] || ""}`,
      fullName: r[1] || "Noma'lum",
      phone: r[2] || "",
      source: r[3] || "boshqa",
    }));
  } catch (e) {
    const msg = e.message || "";
    const debugInfo = `[ID: ${sheetId}, Range: "${range}"]`;
    if (msg.includes("not found") || msg.includes("Unable to parse range")) {
      throw new Error(
        `Google Sheets xatosi: "${msg}" ${debugInfo}. Tekshiring: (1) Sheet ID to'g'riligi, ` +
        `(2) Sheet service account emailiga ulashilganmi, (3) Range'dagi varaq nomi ("${range}") ` +
        `haqiqiy varaq nomiga mos keladimi.`
      );
    }
    if (msg.includes("permission") || msg.includes("PERMISSION_DENIED") || msg.includes("caller does not have")) {
      throw new Error(
        `Google Sheets xatosi: ruxsat yo'q ${debugInfo}. Sheetni service account emailiga ` +
        `("${credentials.client_email}") Viewer sifatida ulashganingizga ishonch hosil qiling.`
      );
    }
    throw new Error(`Google Sheets xatosi: ${msg} ${debugInfo}`);
  }
}
