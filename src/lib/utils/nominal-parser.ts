/**
 * Parser for Indonesian colloquial monetary expressions:
 * - 15rb, 15ribu -> 15,000
 * - 500k, 50k -> 500,000, 50,000
 * - 1.5jt, 1,5jt, 2jt, 2.5juta -> 1,500,000, 2,000,000, 2,500,000
 * - 1m, 1.2miliar -> 1,000,000,000
 * - Rp 25.000, Rp. 50,000 -> 25,000, 50,000
 */

export function parseIndonesianNominal(text: string): { amount: number | null; rawMatched?: string } {
  if (!text) return { amount: null };

  const cleaned = text.toLowerCase().trim();

  // Pattern 1: numbers with juta / jt / m / miliar
  // Examples: "1.5jt", "1,5jt", "2 jt", "500juta", "1.2miliar", "1m", "2milyar"
  const millionPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta|miliar|milyar|m)\b/i;
  const matchMillion = cleaned.match(millionPattern);
  if (matchMillion) {
    const rawVal = matchMillion[1].replace(",", ".");
    const num = parseFloat(rawVal);
    const suffix = matchMillion[0].slice(matchMillion[0].indexOf(matchMillion[1]) + matchMillion[1].length).trim().toLowerCase();
    const isMilyar = suffix === "m" || suffix.startsWith("miliar") || suffix.startsWith("milyar");
    const multiplier = isMilyar ? 1_000_000_000 : 1_000_000;
    return {
      amount: Math.round(num * multiplier),
      rawMatched: matchMillion[0],
    };
  }

  // Pattern 2: numbers with rb / ribu / k
  // Examples: "15rb", "15 rb", "20ribu", "20.5rb", "500k", "50k"
  const thousandPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/i;
  const matchThousand = cleaned.match(thousandPattern);
  if (matchThousand) {
    const rawVal = matchThousand[1].replace(",", ".");
    const num = parseFloat(rawVal);
    return {
      amount: Math.round(num * 1_000),
      rawMatched: matchThousand[0],
    };
  }

  // Pattern 3: standard Rupiah notation with dots/commas
  // Examples: "Rp 25.000", "Rp. 150.000", "Rp1.500.000"
  const rupiahPattern = /rp\.?\s*(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+)/i;
  const matchRupiah = cleaned.match(rupiahPattern);
  if (matchRupiah) {
    const cleanNum = matchRupiah[1].replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && num > 0) {
      return {
        amount: Math.round(num),
        rawMatched: matchRupiah[0],
      };
    }
  }

  // Pattern 4: dotted thousand separator without "rp"
  // Examples: "beli bakso 15.000", "isi bensin 50.000", "bayar kos 1.500.000"
  const dottedPattern = /(?:^|\s|[:=])(\d{1,3}(?:\.\d{3})+(?:,\d+)?)(?:\s|$|[^\w.,])/i;
  const matchDotted = cleaned.match(dottedPattern);
  if (matchDotted) {
    const cleanNum = matchDotted[1].replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && num > 0) {
      return {
        amount: Math.round(num),
        rawMatched: matchDotted[1],
      };
    }
  }

  // Pattern 5: plain number at least 4 digits or isolated number
  // Examples: "beli makan 25000", "transfer 50000"
  const plainNumberPattern = /\b(\d{4,12})\b/;
  const matchPlain = cleaned.match(plainNumberPattern);
  if (matchPlain) {
    const num = parseInt(matchPlain[1], 10);
    return {
      amount: num,
      rawMatched: matchPlain[0],
    };
  }

  return { amount: null };
}

/**
 * Fast intent analyzer to distinguish Income vs Expense from natural Indonesian text:
 */
export function detectTransactionIntent(text: string): {
  type: "income" | "expense";
  confidence: number;
} {
  const lower = text.toLowerCase();

  const incomeKeywords = [
    "gaji",
    "gajian",
    "dapat uang",
    "terima transfer",
    "bonus",
    "cashback",
    "dividen",
    "penjualan",
    "hasil jual",
    "upah",
    "honor",
    "angpao",
    "pemasukan",
    "masuk",
    "infaq diterima",
    "thr",
    "omset",
    "omzet",
    "kiriman",
    "profit",
    "komisi",
    "refund",
    "dapat ",
    "terima ",
  ];

  const expenseKeywords = [
    "beli",
    "bayar",
    "ngopi",
    "makan",
    "jajan",
    "ongkir",
    "bensin",
    "parkir",
    "tagihan",
    "belanja",
    "langganan",
    "checkout",
    "sewa",
    "service",
    "pulsa",
    "kuota",
    "pengeluaran",
    "keluar",
    "nongkrong",
    "sarapan",
    "lunch",
    "dinner",
    "ojol",
    "grab",
    "gojek",
    "shopee",
    "tokopedia",
    "indomaret",
    "alfamart",
  ];

  for (const kw of incomeKeywords) {
    if (lower.includes(kw)) {
      return { type: "income", confidence: 0.95 };
    }
  }

  for (const kw of expenseKeywords) {
    if (lower.includes(kw)) {
      return { type: "expense", confidence: 0.95 };
    }
  }

  // Default to expense if unclear
  return { type: "expense", confidence: 0.6 };
}
