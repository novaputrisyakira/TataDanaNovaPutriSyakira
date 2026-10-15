/**
 * Timezone and Indonesian Date Helpers for WIB (Asia/Jakarta)
 */

const DAYS_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Convert any date / string / number into a Date object adjusted to Asia/Jakarta (UTC+7)
 */
export function getWIBDate(dateInput: string | number | Date = new Date()): Date {
  const d = new Date(dateInput);
  // Get UTC milliseconds + 7 hours
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

/**
 * Format telegram bot header timestamp:
 * "📅 [Hari], [Tanggal] — [Jam WIB]"
 * e.g., "📅 Senin, 14 Oktober 2026 — 14:30 WIB"
 */
export function formatWIBTelegramHeader(dateInput: string | number | Date = new Date()): string {
  const wib = getWIBDate(dateInput);
  const dayName = DAYS_ID[wib.getDay()];
  const day = wib.getDate();
  const monthName = MONTHS_ID[wib.getMonth()];
  const year = wib.getFullYear();
  const hours = String(wib.getHours()).padStart(2, "0");
  const minutes = String(wib.getMinutes()).padStart(2, "0");

  return `📅 ${dayName}, ${day} ${monthName} ${year} — ${hours}:${minutes} WIB`;
}

/**
 * Format date for table display: "14 Okt 2026, 14:30 WIB"
 */
export function formatWIBShort(dateInput: string | number | Date): string {
  const wib = getWIBDate(dateInput);
  const day = wib.getDate();
  const monthShort = MONTHS_ID[wib.getMonth()].substring(0, 3);
  const year = wib.getFullYear();
  const hours = String(wib.getHours()).padStart(2, "0");
  const minutes = String(wib.getMinutes()).padStart(2, "0");

  return `${day} ${monthShort} ${year}, ${hours}:${minutes} WIB`;
}

/**
 * Get current ISO string in WIB timezone
 */
export function nowWIBISO(): string {
  return new Date().toISOString();
}
