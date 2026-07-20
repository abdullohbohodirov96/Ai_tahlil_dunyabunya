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

// Ustun harfini (A, B, C...) massiv indeksiga aylantiradi (A=0, B=1, ...)
function colLetterToIndex(letter, fallback) {
  if (!letter) return fallback;
  const clean = letter.trim().toUpperCase();
  if (!/^[A-Z]$/.test(clean)) return fallback;
  return clean.charCodeAt(0) - 65;
}

// Telefon raqamidagi "p:", bo'sh joy va h.k. ortiqcha belgilarni tozalaydi
function cleanPhone(raw) {
  if (!raw) return "";
  return raw.replace(/^p:\s*/i, "").trim();
}

export async function fetchLeadsFromSheet() {
  const rawKey = await getSetting("google_service_account_json", "GOOGLE_SERVICE_ACCOUNT_JSON");
  const rawSheetId = await getSetting("google_sheet_id", "SALES_SHEET_ID");
  const sheetId = extractSheetId(rawSheetId);
  const range = (await getSetting("google_sheet_range", "SALES_SHEET_RANGE")) || "A2:F";

  // Ustun tartibi moslashuvchan — sozlamalarda ko'rsatilmasa, eski standart
  // tartib ishlatiladi (B=Ism, C=Telefon, D=Manba)
  const nameCol = colLetterToIndex(await getSetting("google_sheet_col_name"), 1);
  const phoneCol = colLetterToIndex(await getSetting("google_sheet_col_phone"), 2);
  const phoneColAlt = colLetterToIndex(await getSetting("google_sheet_col_phone_alt"), null);
  const sourceCol = colLetterToIndex(await getSetting("google_sheet_col_source"), 3);
  const sourceColExtra = colLetterToIndex(await getSetting("google_sheet_col_source_extra"), null);

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

    return rows
      .filter((r) => r && r.length)
      .map((r, i) => {
        // Telefon: ikkala ustundagi raqam ham bo'lsa, ikkalasini birlashtirib ko'rsatadi
        const primaryPhone = cleanPhone(r[phoneCol]);
        const altPhone = phoneColAlt != null ? cleanPhone(r[phoneColAlt]) : "";
        const phone = [primaryPhone, altPhone].filter(Boolean).join(" / ");

        // Manba: agar qo'shimcha ustun ko'rsatilgan bo'lsa, ikkalasini birlashtiradi
        const sourceMain = r[sourceCol] || "";
        const sourceExtra = sourceColExtra != null ? r[sourceColExtra] || "" : "";
        const source = [sourceMain, sourceExtra].filter(Boolean).join(" · ") || "boshqa";

        // rowId qatorning o'rniga asoslanadi (ustun sozlamalari o'zgarsa ham barqaror qoladi)
        return {
          rowId: `sheet-row-${i}`,
          fullName: r[nameCol] || "Noma'lum",
          phone,
          source,
        };
      });
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
