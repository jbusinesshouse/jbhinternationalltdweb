import { BATCH_SIZE } from "./constants";

export { BATCH_SIZE };

export type ProductFeedItem = {
  id: string;
  productImg: string | null;
  name: string;
  price: string;
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
  price: string;
  moq: number;
  seller_id: string;
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
      return {
        id: product.id,
        name: product.name,
        price: product.price,
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
  product_images (
    image_url,
    is_main
  )
`;
