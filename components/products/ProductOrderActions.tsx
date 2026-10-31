"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { findOrCreateChatRoom } from "@/lib/chat";
import { canChat } from "@/lib/accountStatus";
import {
  canPlaceOrders,
  getOrderBlockReason,
  type UserProfile,
} from "@/lib/profile";
import type { ProductVariantOption } from "@/lib/products";

type ProductSize = {
  id: string;
  size: string;
  stock: number;
  variant_id: string;
};

type ProductVariant = {
  id: string;
  color: string;
};

type ProductOrderActionsProps = {
  product: {
    id: string;
    name: string;
    price: string;
    moq: number;
    seller_id: string;
    product_images: { image_url: string; is_main: boolean }[];
  };
  /** Variants + sizes from the product API response. */
  productVariants: ProductVariantOption[];
  userId: string | null;
  buyerProfile: Pick<UserProfile, "store_type" | "status"> | null;
  /** False until an SMS provider is configured on the API. */
  guestCheckoutEnabled: boolean;
};

function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  label,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
}) {
  const btn =
    "grid h-10 w-11 place-items-center text-xl text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-35";
  return (
    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#D1D5DB] bg-white">
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= 0} className={btn} aria-label={`${label} কমান`}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="h-10 w-14 border-x border-border bg-transparent text-center font-bold focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label={`${label} পরিমাণ`}
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} className={btn} aria-label={`${label} বাড়ান`}>
        +
      </button>
    </div>
  );
}

export function ProductOrderActions({
  product,
  productVariants,
  userId,
  buyerProfile,
  guestCheckoutEnabled,
}: ProductOrderActionsProps) {
  const router = useRouter();
  const variants: ProductVariant[] = useMemo(
    () => productVariants.map((v) => ({ id: v.id, color: v.color })),
    [productVariants]
  );
  const sizes: ProductSize[] = useMemo(
    () =>
      productVariants.flatMap((v) =>
        (v.product_sizes ?? []).map((s) => ({
          id: s.id,
          size: s.size ?? s.sizes?.label ?? "",
          stock: s.stock ?? 0,
          variant_id: v.id,
        }))
      ),
    [productVariants]
  );
  const [qty, setQty] = useState<Record<string, Record<string, number>>>({});
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const buyerProfileLoading = false;

  const setQuantity = (variantId: string, sizeId: string, value: number) => {
    const size = sizes.find((s) => s.id === sizeId);
    const safe = Math.max(0, Math.min(size?.stock ?? 0, value));
    setQty((prev) => ({
      ...prev,
      [variantId]: { ...prev[variantId], [sizeId]: safe },
    }));
  };

  const activeVariant = variants[activeVariantIndex];
  const activeSizes = activeVariant
    ? sizes.filter((s) => s.variant_id === activeVariant.id)
    : [];

  const totalQty = useMemo(
    () =>
      Object.values(qty).reduce(
        (acc, variantSizes) =>
          acc + Object.values(variantSizes).reduce((sum, q) => sum + q, 0),
        0
      ),
    [qty]
  );

  const estimatedTotal = totalQty * Number(product.price);
  const isBelowMoq = totalQty > 0 && totalQty < product.moq;
  const meetsMoq = totalQty >= product.moq;
  const canOrderSignedIn =
    !buyerProfileLoading && canPlaceOrders(buyerProfile);
  /** Guests can checkout with SMS OTP (once enabled); signed-in users need a non-frozen account. */
  const canOrder = userId ? canOrderSignedIn : guestCheckoutEnabled;
  const orderBlockReason = buyerProfileLoading
    ? null
    : userId
      ? getOrderBlockReason(buyerProfile)
      : null;

  const handleCheckout = () => {
    if (userId && !canOrderSignedIn) return;
    if (!meetsMoq) return;

    const payload = {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
      selectedQty: qty,
      variants,
      sizes,
    };
    router.push(
      `/checkout?data=${encodeURIComponent(JSON.stringify(payload))}`
    );
  };

  const handleMessage = async () => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }
    if (!canChat(buyerProfile?.status)) {
      alert("আপনার অ্যাকাউন্ট ফ্রিজ করা আছে, মেসেজ পাঠানো যাবে না।");
      return;
    }
    setLoading(true);
    const mainImg =
      product.product_images.find((i) => i.is_main)?.image_url ?? null;
    const result = await findOrCreateChatRoom(product.seller_id, {
      productId: product.id,
      name: product.name,
      price: product.price,
      moq: product.moq,
      imageUrl: mainImg,
    });
    setLoading(false);
    if ("roomId" in result) {
      router.push(`/messages/${result.roomId}`);
    } else {
      alert(result.error);
    }
  };

  const shortBy = product.moq - totalQty;
  const checkoutLabel =
    !userId && !guestCheckoutEnabled
      ? "সাইন ইন করে অর্ডার করুন"
      : userId && buyerProfile?.status === "freeze"
        ? "অ্যাকাউন্ট ফ্রিজ করা"
        : "অর্ডার করুন";

  return (
    <div className="flex flex-col gap-5">
      {variants.length === 0 ? (
        <p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">
          এই পণ্যের সাইজ দেওয়া নেই। বিস্তারিত জানতে সেলারকে মেসেজ দিন।
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            <p className="font-bold">রং</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant, index) => {
                const picked = Object.values(qty[variant.id] ?? {}).reduce((a, b) => a + b, 0);
                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={index === activeVariantIndex}
                    onClick={() => setActiveVariantIndex(index)}
                    className={`h-11 rounded-xl border-2 px-4 text-sm font-bold transition-colors ${
                      index === activeVariantIndex
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-white hover:border-primary/60"
                    }`}
                  >
                    {variant.color}
                    {picked > 0 && (
                      <span className="ml-2 rounded-full bg-navy px-2 py-0.5 text-xs text-white">{picked}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="font-bold">সাইজ ও পরিমাণ</p>
            {activeSizes.length === 0 ? (
              <p className="text-sm text-muted">এই রঙে কোনো সাইজ নেই।</p>
            ) : (
              <div className="divide-y divide-[#F0F1F4] overflow-hidden rounded-2xl border border-border bg-white">
                {activeSizes.map((size) => {
                  const currentQty = qty[activeVariant.id]?.[size.id] ?? 0;
                  const outOfStock = size.stock <= 0;
                  return (
                    <div key={size.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3.5">
                        <span className="grid h-9 min-w-12 place-items-center rounded-[10px] bg-[#F3F4F6] px-2 font-extrabold">
                          {size.size}
                        </span>
                        <span className={`text-[13px] ${outOfStock ? "font-semibold text-red-700" : "text-muted"}`}>
                          {outOfStock ? "স্টক নেই" : `${size.stock.toLocaleString("bn-BD")} পিস স্টকে`}
                        </span>
                      </div>
                      <QuantityStepper
                        label={size.size}
                        value={currentQty}
                        max={size.stock}
                        disabled={outOfStock}
                        onChange={(value) => setQuantity(activeVariant.id, size.id, value)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {variants.length > 1 && (
              <p className="text-xs text-muted">
                অন্য রং বেছে নিয়ে সেগুলোর পরিমাণও যোগ করতে পারবেন — সব একসাথে এক অর্ডারে যাবে।
              </p>
            )}
          </div>
        </>
      )}

      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4"
        aria-live="polite"
      >
        <div>
          <p className="text-sm text-muted">মোট {totalQty.toLocaleString("bn-BD")} পিস</p>
          <p className="mt-0.5 text-2xl font-extrabold">৳{estimatedTotal.toLocaleString("bn-BD")}</p>
        </div>
        {meetsMoq ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-teal">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            MOQ পূরণ হয়েছে
          </p>
        ) : isBelowMoq ? (
          <p className="text-sm font-semibold text-moq">
            আরও {shortBy.toLocaleString("bn-BD")} পিস যোগ করুন (MOQ {product.moq.toLocaleString("bn-BD")})
          </p>
        ) : (
          <p className="text-sm text-muted">সর্বনিম্ন {product.moq.toLocaleString("bn-BD")} পিস (সব সাইজ মিলিয়ে)</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {!userId && !guestCheckoutEnabled ? (
          <a
            href={`/sign-in?next=${encodeURIComponent(`/products/${product.id}`)}`}
            className="flex h-[54px] flex-[1_1_220px] items-center justify-center rounded-2xl bg-primary text-[17px] font-extrabold text-primary-ink hover:bg-primary-dark"
          >
            {checkoutLabel}
          </a>
        ) : (
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!canOrder || !meetsMoq || variants.length === 0}
            className="h-[54px] flex-[1_1_220px] rounded-2xl bg-primary text-[17px] font-extrabold text-primary-ink transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-45"
          >
            {checkoutLabel}
          </button>
        )}
        <button
          type="button"
          onClick={handleMessage}
          disabled={loading}
          className="flex h-[54px] flex-[1_1_220px] items-center justify-center gap-2 rounded-2xl bg-navy font-bold text-white transition-colors hover:bg-navy-dark disabled:opacity-60"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {loading ? "খোলা হচ্ছে..." : userId ? "সেলারকে মেসেজ" : "সাইন ইন করে মেসেজ"}
        </button>
      </div>

      {!userId && guestCheckoutEnabled && (
        <p className="text-sm text-muted">অ্যাকাউন্ট ছাড়াই অর্ডার করা যায় — চেকআউটে SMS কোড দিয়ে কনফার্ম করুন।</p>
      )}
      {userId && orderBlockReason && <p className="text-sm font-semibold text-moq">{orderBlockReason}</p>}
    </div>
  );
}
