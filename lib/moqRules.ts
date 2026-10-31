/** Buyer minimum for a wholesale listing. Mirrors the API and database trigger. */
export const WHOLESALE_MIN_ORDER_QTY = 6;
/** Buyer minimum for a retail listing. */
export const RETAIL_MIN_ORDER_QTY = 1;

export function isProductListingAccount(
  storeType: string | null | undefined
): boolean {
  return storeType === "wholesale" || storeType === "retail";
}

export function minimumOrderQuantityForStoreType(
  storeType: string | null | undefined
): number | null {
  if (storeType === "wholesale") return WHOLESALE_MIN_ORDER_QTY;
  if (storeType === "retail") return RETAIL_MIN_ORDER_QTY;
  return null;
}

export function moqValidationMessage(
  storeType: string | null | undefined,
  moq: number | null
): string | null {
  if (moq == null || !Number.isInteger(moq)) {
    return "Please enter a whole-number minimum order quantity.";
  }
  const min = minimumOrderQuantityForStoreType(storeType);
  if (min == null) {
    return "Only retail or wholesale seller accounts can upload products.";
  }
  if (moq < min) {
    return storeType === "wholesale"
      ? `Wholesale minimum order quantity must be at least ${min}.`
      : `Retail minimum order quantity must be at least ${min}.`;
  }
  return null;
}
