/** Mirrors backend/src/services/vat.ts — display + checkout line estimates. */

export const VAT_RATE_WHOLESALE = 0.1;
export const VAT_RATE_RETAIL = 0.15;

export type SellerStoreType = "wholesale" | "retail" | string | null | undefined;

export type VatBreakdown = {
  base: number;
  vat: number;
  inclusive: number;
  rate: number;
};

export function vatRateForSellerStoreType(storeType: SellerStoreType): number {
  if (storeType === "wholesale") return VAT_RATE_WHOLESALE;
  return VAT_RATE_RETAIL;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Inclusive (buyer) price → nearest whole BDT; vat derived so base + vat === inclusive. */
export function priceWithVat(base: number, rate: number): VatBreakdown {
  const safeBase = roundMoney(Number(base) || 0);
  const safeRate = Number(rate) || 0;
  const inclusive = Math.round(safeBase * (1 + safeRate));
  const vat = roundMoney(inclusive - safeBase);
  return { base: safeBase, vat, inclusive, rate: safeRate };
}

export function buyerPriceVatHint(
  baseInput: string | number,
  storeType: SellerStoreType
): string | null {
  const base = typeof baseInput === "string" ? Number(baseInput) : baseInput;
  if (!Number.isFinite(base) || base <= 0) return null;
  const rate = vatRateForSellerStoreType(storeType);
  const { inclusive } = priceWithVat(base, rate);
  const pct = Math.round(rate * 100);
  return `Buyers will see BDT ${inclusive} (base + ${pct}% VAT)`;
}

export function enrichProductPriceFields<
  T extends {
    price?: number | string | null;
    seller_store_type?: SellerStoreType;
  },
>(product: T): T & {
  price_base: number;
  vat_rate: number;
  vat_amount: number;
  price: number;
} {
  const base = Number(product.price) || 0;
  const rate = vatRateForSellerStoreType(product.seller_store_type);
  const { vat, inclusive } = priceWithVat(base, rate);
  return {
    ...product,
    price_base: roundMoney(base),
    vat_rate: rate,
    vat_amount: vat,
    price: inclusive,
  };
}
