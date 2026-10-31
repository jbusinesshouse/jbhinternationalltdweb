/** Bangla-first labels for API values shown across the site. */

const CATEGORY_LABELS: Record<string, string> = {
  men: "ছেলেদের",
  women: "মেয়েদের",
  children: "শিশুদের",
};

/** "Men" → "ছেলেদের · Men"; unknown names are shown as-is. */
export function categoryLabel(name: string, withEnglish = false): string {
  const bn = CATEGORY_LABELS[name.trim().toLowerCase()];
  if (!bn) return name;
  return withEnglish ? `${bn} · ${name}` : bn;
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** 1375 → "১,৩৭৫" (en-IN grouping, Bangla digits). */
export function bnNumber(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n
    .toLocaleString("en-IN", { maximumFractionDigits: 2 })
    .replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function bnPrice(value: number | string): string {
  return `৳${bnNumber(value)}`;
}

export const STORE_TYPE_LABEL: Record<string, string> = {
  wholesale: "পাইকারি",
  retail: "খুচরা",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "নতুন",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
  hold: "হোল্ড",
};
