"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { findOrCreateChatRoom } from "@/lib/chat";
import { supabase } from "@/lib/supabase/browser";

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
  userId: string | null;
};

function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const atMin = value <= 0;
  const atMax = value >= max;

  return (
    <div className="flex items-center rounded-lg border border-border bg-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || atMin}
        className="flex h-9 w-9 items-center justify-center text-lg text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="h-9 w-12 border-x border-border bg-transparent text-center text-sm font-medium text-foreground focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || atMax}
        className="flex h-9 w-9 items-center justify-center text-lg text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function ProductOrderActions({
  product,
  userId,
}: ProductOrderActionsProps) {
  const router = useRouter();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [qty, setQty] = useState<Record<string, Record<string, number>>>({});
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingVariants(true);
      const { data: v } = await supabase
        .from("product_variants")
        .select("id, color")
        .eq("product_id", product.id);
      setVariants(v ?? []);
      if (v?.length) {
        const { data: s } = await supabase
          .from("product_sizes")
          .select("id, size, stock, variant_id")
          .in(
            "variant_id",
            v.map((x) => x.id)
          );
        setSizes(s ?? []);
      }
      setLoadingVariants(false);
    };
    load();
  }, [product.id]);

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

  const handleCheckout = () => {
    if (!userId) {
      router.push("/sign-in");
      return;
    }
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
    setLoading(true);
    const mainImg =
      product.product_images.find((i) => i.is_main)?.image_url ?? null;
    const result = await findOrCreateChatRoom(userId, product.seller_id, {
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

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-border bg-white p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Select Size &amp; Quantity
        </h2>
        <p className="mt-1 text-sm text-muted">
          Minimum order: <span className="font-medium text-foreground">{product.moq} pieces</span> total across all sizes
        </p>

        {loadingVariants ? (
          <div className="mt-6 flex items-center justify-center py-8 text-sm text-muted">
            Loading available sizes...
          </div>
        ) : variants.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No size options listed for this product. Message the seller for details.
          </p>
        ) : (
          <>
            {variants.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant, index) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setActiveVariantIndex(index)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        index === activeVariantIndex
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white text-foreground hover:border-primary/50"
                      }`}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeVariant && (
              <div className="mt-5">
                {variants.length === 1 && (
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {activeVariant.color}
                  </p>
                )}

                {activeSizes.length === 0 ? (
                  <p className="text-sm text-muted">No sizes available for this color.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="hidden grid-cols-[1fr_auto] gap-4 bg-surface px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted sm:grid">
                      <span>Size</span>
                      <span>Quantity</span>
                    </div>
                    <div className="divide-y divide-border">
                      {activeSizes.map((size) => {
                        const currentQty = qty[activeVariant.id]?.[size.id] ?? 0;
                        const outOfStock = size.stock <= 0;

                        return (
                          <div
                            key={size.id}
                            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-foreground">{size.size}</p>
                              <p className={`text-xs ${outOfStock ? "text-red-500" : "text-muted"}`}>
                                {outOfStock
                                  ? "Out of stock"
                                  : `${size.stock} available`}
                              </p>
                            </div>
                            <QuantityStepper
                              value={currentQty}
                              max={size.stock}
                              disabled={outOfStock}
                              onChange={(value) =>
                                setQuantity(activeVariant.id, size.id, value)
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {variants.length > 1 && (
                  <p className="mt-3 text-xs text-muted">
                    Switch colors above to add quantities for other variants. Your total order includes all selected sizes.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {totalQty > 0 && (
          <div className="mt-5 rounded-lg bg-surface p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Total pieces selected</span>
              <span className="font-semibold text-foreground">{totalQty}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">Estimated total</span>
              <span className="font-semibold text-foreground">
                BDT {estimatedTotal.toLocaleString()}
              </span>
            </div>
            {isBelowMoq && (
              <p className="mt-2 text-sm text-amber-600">
                Add {product.moq - totalQty} more piece{product.moq - totalQty === 1 ? "" : "s"} to meet the minimum order quantity.
              </p>
            )}
            {meetsMoq && (
              <p className="mt-2 text-sm text-green-600">
                Minimum order quantity met.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {userId ? (
          <>
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!meetsMoq || variants.length === 0}
            >
              Proceed to Checkout
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleMessage}
              disabled={loading}
            >
              {loading ? "..." : "Message Seller"}
            </Button>
          </>
        ) : (
          <>
            <Button href="/sign-in" size="lg">
              Sign In to Order
            </Button>
            <Button href="/sign-in" variant="outline" size="lg">
              Message Seller
            </Button>
          </>
        )}
      </div>

      {!userId && (
        <p className="mt-3 text-sm text-muted">
          You can browse sizes above. Sign in to place an order or message the seller.
        </p>
      )}
    </div>
  );
}
