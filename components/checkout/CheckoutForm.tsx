"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  DeliveryAddressFormFields,
  AddressFormValues,
  emptyAddressForm,
} from "@/components/delivery/DeliveryAddressFormFields";
import { Card, PageHeader } from "@/components/ui/PageElements";
import {
  createDeliveryAddress,
  DeliveryAddress,
  formatDeliveryAddressLine,
  listDeliveryAddresses,
  setDefaultDeliveryAddress,
  toOrderDeliverySnapshot,
} from "@/lib/deliveryAddresses";
import { canPlaceOrders, getOrderBlockReason } from "@/lib/profile";
import type { UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase/browser";

type AddressMode = "store" | "saved" | "custom";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function CheckoutForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");

  const parsed = useMemo(() => {
    if (!dataParam) return null;
    try {
      return JSON.parse(decodeURIComponent(dataParam));
    } catch {
      return null;
    }
  }, [dataParam]);

  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
  });
  const [addressMode, setAddressMode] = useState<AddressMode>("store");
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState<AddressFormValues>(
    emptyAddressForm()
  );
  const [saveCustomAddress, setSaveCustomAddress] = useState(true);
  const [setCustomAsDefault, setSetCustomAsDefault] = useState(false);
  const [defaultDeliveryAddressId, setDefaultDeliveryAddressId] = useState<
    string | null
  >(profile.default_delivery_address_id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const orderBlockReason = getOrderBlockReason(profile);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const userId = profile.id;
      if (!userId) return;

      setAddressesLoading(true);
      try {
        const rows = await listDeliveryAddresses(userId);
        if (cancelled) return;
        setSavedAddresses(rows);

        const defaultId = profile.default_delivery_address_id ?? null;
        setDefaultDeliveryAddressId(defaultId);

        if (defaultId) {
          const match = rows.find((r) => r.id === defaultId);
          if (match) {
            setAddressMode("saved");
            setSelectedSavedId(defaultId);
          }
        } else if (
          !profile.district ||
          !profile.address
        ) {
          if (rows.length > 0) {
            setAddressMode("saved");
            setSelectedSavedId(rows[0].id);
          } else {
            setAddressMode("custom");
          }
        }
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [profile.id, profile.default_delivery_address_id, profile.district, profile.address]);

  const lineItems = useMemo(() => {
    if (!parsed) return [];
    const items: Array<{
      variant_id: string;
      size_id: string;
      quantity: number;
      product_name_snapshot: string;
      price_snapshot: number;
    }> = [];
    const { selectedQty, variants, sizes, product } = parsed;
    for (const variant of variants ?? []) {
      for (const size of sizes?.filter(
        (s: { variant_id: string }) => s.variant_id === variant.id
      ) ?? []) {
        const qty = selectedQty?.[variant.id]?.[size.id] ?? 0;
        if (qty > 0) {
          items.push({
            variant_id: variant.id,
            size_id: size.id,
            quantity: qty,
            product_name_snapshot: product.name,
            price_snapshot: Number(product.price),
          });
        }
      }
    }
    return items;
  }, [parsed]);

  const total = lineItems.reduce(
    (sum, i) => sum + i.quantity * i.price_snapshot,
    0
  );

  const storeSnapshot = useMemo(() => {
    if (!profile.district || !profile.address) return null;
    return toOrderDeliverySnapshot({
      district: profile.district ?? "",
      upazila: profile.upazila,
      address: profile.address ?? "",
    });
  }, [profile.district, profile.upazila, profile.address]);

  const resolveDeliverySnapshot = (): {
    city: string;
    delivery_address: string;
  } | null => {
    if (addressMode === "store") return storeSnapshot;

    if (addressMode === "saved") {
      const selected = savedAddresses.find((a) => a.id === selectedSavedId);
      if (!selected) return null;
      return toOrderDeliverySnapshot(selected);
    }

    if (!customForm.district.trim() || !customForm.address.trim()) return null;
    return toOrderDeliverySnapshot(customForm);
  };

  if (!parsed) {
    return (
      <Card>
        <p>Invalid checkout data. Please start from a product page.</p>
        <Button href="/products" className="mt-4">
          Browse Products
        </Button>
      </Card>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canPlaceOrders(profile)) {
      setFormError(
        orderBlockReason ?? "You cannot place orders with this account."
      );
      return;
    }
    if (!lineItems.length) {
      setFormError("Select quantity first.");
      return;
    }

    const delivery = resolveDeliverySnapshot();
    if (!delivery) {
      if (addressMode === "store") {
        setFormError(
          "Your store address is incomplete. Use a saved or new address."
        );
      } else if (addressMode === "saved") {
        setFormError("Please select a saved delivery address.");
      } else {
        setFormError("District and address are required.");
      }
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setFormError("Please sign in to place an order.");
        setSubmitting(false);
        return;
      }

      if (addressMode === "custom" && saveCustomAddress) {
        const created = await createDeliveryAddress(user.id, customForm);
        setSavedAddresses((prev) => [created, ...prev]);
        if (setCustomAsDefault) {
          await setDefaultDeliveryAddress(user.id, created.id);
          setDefaultDeliveryAddressId(created.id);
        }
      }

      const { data: sellerRow } = await supabase
        .from("products")
        .select("seller_id")
        .eq("id", parsed.product.id)
        .single();

      const { data, error } = await supabase.rpc("place_order", {
        p_product_id: parsed.product.id,
        p_seller_id: sellerRow?.seller_id,
        p_full_name: form.full_name,
        p_phone: form.phone,
        p_email: form.email || null,
        p_city: delivery.city,
        p_delivery_address: delivery.delivery_address,
        p_items: lineItems,
      });

      if (error) {
        setFormError(error.message);
        return;
      }
      router.push(`/orders/${data?.order_id ?? data}`);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Could not place order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const chipClass = (mode: AddressMode) =>
    `flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
      addressMode === mode
        ? "border-foreground bg-foreground text-white"
        : "border-border bg-surface text-muted hover:bg-border"
    }`;

  return (
    <div>
      <PageHeader title="Checkout" description="Confirm your order" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact</h3>
            {(["full_name", "phone", "email"] as const).map((key) => (
              <input
                key={key}
                required={key !== "email"}
                placeholder={
                  key === "full_name"
                    ? "Full name *"
                    : key === "phone"
                      ? "Phone number *"
                      : "Email (optional)"
                }
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className={inputClass}
              />
            ))}

            <h3 className="font-semibold text-foreground">Delivery address</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddressMode("store")}
                className={chipClass("store")}
              >
                Store
              </button>
              <button
                type="button"
                onClick={() => setAddressMode("saved")}
                className={chipClass("saved")}
              >
                Saved
              </button>
              <button
                type="button"
                onClick={() => setAddressMode("custom")}
                className={chipClass("custom")}
              >
                New
              </button>
            </div>

            {addressMode === "store" && (
              <div className="rounded-xl border border-border bg-surface/50 p-4">
                {storeSnapshot ? (
                  <>
                    <p className="font-semibold text-foreground">
                      Deliver to store address
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {formatDeliveryAddressLine({
                        district: profile.district,
                        upazila: profile.upazila,
                        address: profile.address,
                      })}
                    </p>
                    {defaultDeliveryAddressId ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const userId = profile.id;
                          await setDefaultDeliveryAddress(userId, null);
                          setDefaultDeliveryAddressId(null);
                        }}
                        className="mt-3 text-sm font-semibold text-primary hover:underline"
                      >
                        Set store address as default
                      </button>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Your default delivery address
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    Your store address is incomplete. Use a saved or new address
                    instead.
                  </p>
                )}
              </div>
            )}

            {addressMode === "saved" && (
              <div className="space-y-3">
                {addressesLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-surface" />
                ) : savedAddresses.length === 0 ? (
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-sm text-muted">
                      No saved delivery addresses yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddressMode("custom")}
                      className="mt-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Create a new address
                    </button>
                  </div>
                ) : (
                  savedAddresses.map((addr) => {
                    const selected = selectedSavedId === addr.id;
                    const isDefault = defaultDeliveryAddressId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedSavedId(addr.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-white hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">
                            {addr.label?.trim() || "Saved address"}
                          </p>
                          {isDefault && (
                            <span className="text-xs font-semibold text-primary">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {formatDeliveryAddressLine(addr)}
                        </p>
                        {selected && !isDefault && (
                          <span
                            role="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const userId = profile.id;
                              await setDefaultDeliveryAddress(
                                userId,
                                addr.id
                              );
                              setDefaultDeliveryAddressId(addr.id);
                            }}
                            className="mt-2 block text-sm font-semibold text-primary hover:underline"
                          >
                            Set as default
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {addressMode === "custom" && (
              <div className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">
                  New delivery address
                </p>
                <div className="mt-3">
                  <DeliveryAddressFormFields
                    values={customForm}
                    onChange={setCustomForm}
                  />
                </div>

                <label className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={saveCustomAddress}
                    onChange={(e) => setSaveCustomAddress(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-foreground">
                    Save this address for next time
                  </span>
                </label>

                {saveCustomAddress && (
                  <label className="mt-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={setCustomAsDefault}
                      onChange={(e) =>
                        setSetCustomAsDefault(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-foreground">
                      Set as my default delivery address
                    </span>
                  </label>
                )}
              </div>
            )}

            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Placing order…" : "Confirm Order"}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-semibold text-foreground">Order Summary</h3>
          <p className="mt-2 text-foreground">{parsed.product.name}</p>
          <div className="mt-4 space-y-2 text-sm">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.product_name_snapshot} × {item.quantity}
                </span>
                <span>
                  BDT {(item.price_snapshot * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xl font-bold text-foreground">
            Total: BDT {total.toFixed(2)}
          </p>
        </Card>
      </div>
    </div>
  );
}
