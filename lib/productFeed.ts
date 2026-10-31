import { BATCH_SIZE } from "./constants";
import { enrichProductPriceFields } from "./vat";

export { BATCH_SIZE };

export type ProductFeedItem = {
  id: string;
  productImg: string | null;
  name: string;
  /** Buyer-facing unit price (VAT-inclusive). */
  price: number | string;
  price_base?: number;
  vat_rate?: number;
  vat_amount?: number;
  moq: number;
  isSponsored?: boolean;
};

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type RawProduct = {
  id: string;
  name: string;
  price: string | number;
  moq: number;
  seller_id: string;
  seller_store_type?: string | null;
  product_images?: { image_url: string; is_main: boolean }[];
};

export function formatProducts(
  data: RawProduct[],
  blockedUserIds: string[] = []
): ProductFeedItem[] {
  return data
    .filter(
      (product) =>
        !blockedUserIds.length || !blockedUserIds.includes(product.seller_id)
    )
    .map((product) => {
      const mainImage = product.product_images?.find(
        (img) => img.is_main === true
      );
      const priced = enrichProductPriceFields({
        price: product.price,
        seller_store_type: product.seller_store_type,
      });
      return {
        id: product.id,
        name: product.name,
        price: priced.price,
        price_base: priced.price_base,
        vat_rate: priced.vat_rate,
        vat_amount: priced.vat_amount,
        moq: product.moq,
        productImg: mainImage?.image_url ?? null,
      };
    });
}

export const PRODUCT_SELECT = `
  id,
  name,
  price,
  moq,
  seller_id,
  seller_store_type,
  product_images (
    image_url,
    is_main
  )
`;
