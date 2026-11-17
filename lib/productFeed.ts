import { BATCH_SIZE } from "./constants";

export { BATCH_SIZE };

/** Product card shape returned by the API's feed / search / store endpoints. */
export type ProductFeedItem = {
  id: string;
  productImg: string | null;
  name: string;
  /** Buyer-facing unit price (incl. service charge). */
  price: number | string;
  price_base?: number;
  service_charge_rate?: number;
  service_charge_amount?: number;
  seller_store_type?: string | null;
  moq: number;
  isSponsored?: boolean;
};
