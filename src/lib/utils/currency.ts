/**
 * Format number to Indonesian Rupiah string
 * Example: 15000 -> "Rp15.000" or "Rp 15.000"
 */
export function formatRupiah(amount: number, withSpace: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withSpace ? "Rp 0" : "Rp0";
  }
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const prefix = amount < 0 ? "-Rp" : "Rp";
  return withSpace ? `${prefix} ${formatted}` : `${prefix}${formatted}`;
}

/**
 * Format compact Indonesian Rupiah (e.g. 15rb, 1.5jt)
 */
export function formatCompactRupiah(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) {
    return `${(abs / 1_000_000_000).toFixed(1).replace(".0", "")} Miliar`;
  }
  if (abs >= 1_000_000) {
    return `${(abs / 1_000_000).toFixed(1).replace(".0", "")} Juta`;
  }
  if (abs >= 1_000) {
    return `${(abs / 1_000).toFixed(0)} Ribu`;
  }
  return formatRupiah(amount);
}
