/** Mirrors backend/src/services/serviceCharge.ts — display + checkout line estimates. */

export const SERVICE_CHARGE_RATE_WHOLESALE = 0.1;
export const SERVICE_CHARGE_RATE_RETAIL = 0.15;

export type SellerStoreType = "wholesale" | "retail" | string | null | undefined;

export type ServiceChargeBreakdown = {
  base: number;
  serviceCharge: number;
  inclusive: number;
  rate: number;
};

export function serviceChargeRateForSellerStoreType(storeType: SellerStoreType): number {
  if (storeType === "wholesale") return SERVICE_CHARGE_RATE_WHOLESALE;
  return SERVICE_CHARGE_RATE_RETAIL;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Inclusive (buyer) price → nearest whole BDT; serviceCharge derived so base + serviceCharge === inclusive. */
export function priceWithServiceCharge(base: number, rate: number): ServiceChargeBreakdown {
  const safeBase = roundMoney(Number(base) || 0);
  const safeRate = Number(rate) || 0;
  const inclusive = Math.round(safeBase * (1 + safeRate));
  const serviceCharge = roundMoney(inclusive - safeBase);
  return { base: safeBase, serviceCharge, inclusive, rate: safeRate };
}

export function buyerPriceServiceChargeHint(
  baseInput: string | number,
  storeType: SellerStoreType
): string | null {
  const base = typeof baseInput === "string" ? Number(baseInput) : baseInput;
  if (!Number.isFinite(base) || base <= 0) return null;
  const rate = serviceChargeRateForSellerStoreType(storeType);
  const { inclusive } = priceWithServiceCharge(base, rate);
  const pct = Math.round(rate * 100);
  return `ক্রেতারা দেখবেন ৳${inclusive.toLocaleString("bn-BD")} (আপনার দাম + ${pct.toLocaleString("bn-BD")}% সার্ভিস চার্জ)`;
}

export function enrichProductPriceFields<
  T extends {
    price?: number | string | null;
    seller_store_type?: SellerStoreType;
  },
>(product: T): T & {
  price_base: number;
  service_charge_rate: number;
  service_charge_amount: number;
  price: number;
} {
  const base = Number(product.price) || 0;
  const rate = serviceChargeRateForSellerStoreType(product.seller_store_type);
  const { serviceCharge, inclusive } = priceWithServiceCharge(base, rate);
  return {
    ...product,
    price_base: roundMoney(base),
    service_charge_rate: rate,
    service_charge_amount: serviceCharge,
    price: inclusive,
  };
}
