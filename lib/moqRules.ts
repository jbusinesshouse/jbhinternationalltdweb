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
    return "MOQ একটি পূর্ণসংখ্যা দিন।";
  }
  const min = minimumOrderQuantityForStoreType(storeType);
  if (min == null) {
    return "শুধু খুচরা বা পাইকারি সেলার অ্যাকাউন্ট পণ্য আপলোড করতে পারে।";
  }
  if (moq < min) {
    return storeType === "wholesale"
      ? `পাইকারি পণ্যের MOQ কমপক্ষে ${min.toLocaleString("bn-BD")} হতে হবে।`
      : `খুচরা পণ্যের MOQ কমপক্ষে ${min.toLocaleString("bn-BD")} হতে হবে।`;
  }
  return null;
}
