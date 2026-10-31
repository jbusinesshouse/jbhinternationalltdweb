"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { placeGuestOrder, requestGuestOrderOtp } from "@/lib/api";
import { supabase } from "@/lib/supabase/browser";

type AddressMode = "store" | "saved" | "custom";

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function CheckoutForm({
  profile,
}: {
  profile: UserProfile | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const isGuest = !profile;

  const parsed = useMemo(() => {
    if (!dataParam) return null;
    try {
      return JSON.parse(decodeURIComponent(dataParam));
    } catch {
      return null;
    }
  }, [dataParam]);

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
  });
  const [addressMode, setAddressMode] = useState<AddressMode>(
    isGuest ? "custom" : "store"
  );
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(!isGuest);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState<AddressFormValues>(
    emptyAddressForm()
  );
  const [saveCustomAddress, setSaveCustomAddress] = useState(true);
  const [setCustomAsDefault, setSetCustomAsDefault] = useState(false);
  const [defaultDeliveryAddressId, setDefaultDeliveryAddressId] = useState<
    string | null
  >(profile?.default_delivery_address_id ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const orderBlockReason = profile ? getOrderBlockReason(profile) : null;

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    const load = async () => {
      setAddressesLoading(true);
      try {
        const rows = await listDeliveryAddresses(profile.id);
        if (cancelled) return;
        setSavedAddresses(rows);

        const defaultId = profile.default_delivery_address_id ?? null;
        setDefaultDeliveryAddressId(defaultId);

        if (defaultId) {
          const match = rows.find((a) => a.id === defaultId);
          if (match) {
            setAddressMode("saved");
            setSelectedSavedId(defaultId);
          }
        } else if (!profile.district || !profile.address) {
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

    void load();
    return () => {
      cancelled = true;
    };
  }, [profile]);

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
    if (!profile?.district || !profile?.address) return null;
    return toOrderDeliverySnapshot({
      district: profile.district ?? "",
      upazila: profile.upazila,
      address: profile.address ?? "",
    });
  }, [profile?.district, profile?.upazila, profile?.address]);

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

  const handleSendOtp = async () => {
    setFormError(null);
    if (!form.phone.trim()) {
      setFormError("Enter your mobile number to receive an OTP.");
      return;
    }
    setOtpSending(true);
    try {
      const res = await requestGuestOrderOtp(form.phone.trim());
      setOtpSent(true);
      setDebugOtp(res.debugOtp ?? null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (profile && !canPlaceOrders(profile)) {
      setFormError(
        orderBlockReason ?? "You cannot place orders with this account."
      );
      return;
    }
    if (!lineItems.length) {
      setFormError("Select quantity first.");
      return;
    }
    if (!form.full_name.trim() || !form.phone.trim()) {
      setFormError("Name and phone are required.");
      return;
    }

    const delivery = resolveDeliverySnapshot();
    if (!delivery) {
      setFormError(
        addressMode === "custom"
          ? "District and address are required."
          : "Please choose a valid delivery address."
      );
      return;
    }

    if (isGuest && !otp.trim()) {
      setFormError("Enter the SMS verification code to confirm your order.");
      return;
    }

    setSubmitting(true);
    try {
      const guestItems = lineItems.map((i) => ({
        variant_id: i.variant_id,
        size_id: i.size_id,
        quantity: i.quantity,
      }));

      if (isGuest) {
        const result = await placeGuestOrder({
          phone: form.phone.trim(),
          otp: otp.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          city: delivery.city,
          address: delivery.delivery_address,
          product_id: parsed.product.id,
          items: guestItems,
        });
        router.push(
          `/order-confirmation?orderId=${encodeURIComponent(result.orderId)}&phone=${encodeURIComponent(form.phone.trim())}`
        );
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setFormError(
          "Session expired. Please sign in again or continue as guest with OTP."
        );
        return;
      }

      if (addressMode === "custom" && saveCustomAddress && profile) {
        const created = await createDeliveryAddress(profile.id, customForm);
        setSavedAddresses((prev) => [created, ...prev]);
        if (setCustomAsDefault) {
          await setDefaultDeliveryAddress(profile.id, created.id);
          setDefaultDeliveryAddressId(created.id);
        }
      }

      const idempotencyKey =
        globalThis.crypto?.randomUUID?.() ??
        `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
      if (!API_URL) {
        throw new Error(
          "API URL is not configured. Set NEXT_PUBLIC_API_URL in .env.local"
        );
      }

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          city: delivery.city,
          address: delivery.delivery_address,
          product_id: parsed.product.id,
          items: guestItems,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        orderId?: string;
        error?: string;
      } | null;
      if (!res.ok) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }
      router.push(`/orders/${json?.orderId}`);
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
      <PageHeader
        title="Checkout"
        description={
          isGuest
            ? "Order with your phone — no account required"
            : "Confirm your order"
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isGuest && (
              <p className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm text-muted">
                We’ll send a one-time SMS code to confirm your order.{" "}
                <Link href="/sign-in" className="font-semibold text-primary">
                  Sign in
                </Link>{" "}
                if you already have an account.
              </p>
            )}

            <h3 className="font-semibold text-foreground">Contact</h3>
            {(["full_name", "phone", "email"] as const).map((key) => (
              <input
                key={key}
                required={key !== "email"}
                placeholder={
                  key === "full_name"
                    ? "Full name *"
                    : key === "phone"
                      ? "Mobile number * (01XXXXXXXXX)"
                      : "Email (optional)"
                }
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className={inputClass}
              />
            ))}

            {isGuest && (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground">
                  SMS verification
                </h3>
                <p className="text-sm text-muted">
                  Confirm your number before we place the order.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={otpSending || !form.phone.trim()}
                  onClick={() => void handleSendOtp()}
                >
                  {otpSending
                    ? "Sending…"
                    : otpSent
                      ? "Resend OTP"
                      : "Send OTP"}
                </Button>
                {otpSent && (
                  <input
                    required
                    inputMode="numeric"
                    placeholder="Enter 6-digit OTP *"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={inputClass}
                  />
                )}
                {debugOtp && (
                  <p className="text-xs text-amber-700">
                    Dev OTP (SMS gateway not configured):{" "}
                    <span className="font-mono font-semibold">{debugOtp}</span>
                  </p>
                )}
              </div>
            )}

            <h3 className="font-semibold text-foreground">Delivery address</h3>
            {!isGuest && (
              <div className="flex gap-2">
                {(
                  [
                    ["store", "Store"],
                    ["saved", "Saved"],
                    ["custom", "New"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAddressMode(mode)}
                    className={chipClass(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {!isGuest && addressMode === "store" && (
              <div className="rounded-xl border border-border bg-surface/50 p-4">
                {storeSnapshot ? (
                  <>
                    <p className="font-semibold text-foreground">
                      Deliver to store address
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {formatDeliveryAddressLine({
                        district: profile?.district,
                        upazila: profile?.upazila,
                        address: profile?.address,
                      })}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">
                    Your store address is incomplete. Use a saved or new address
                    instead.
                  </p>
                )}
              </div>
            )}

            {!isGuest && addressMode === "saved" && (
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
                        <p className="font-semibold text-foreground">
                          {addr.label?.trim() || "Saved address"}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {formatDeliveryAddressLine(addr)}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {(isGuest || addressMode === "custom") && (
              <div className="rounded-xl border border-border p-4">
                <p className="font-semibold text-foreground">
                  Delivery address
                </p>
                <div className="mt-3">
                  <DeliveryAddressFormFields
                    values={customForm}
                    onChange={setCustomForm}
                  />
                </div>
                {!isGuest && (
                  <>
                    <label className="mt-4 flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={saveCustomAddress}
                        onChange={(e) =>
                          setSaveCustomAddress(e.target.checked)
                        }
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
                  </>
                )}
              </div>
            )}

            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || (isGuest && !otpSent)}
              className="w-full"
            >
              {submitting
                ? "Placing order…"
                : isGuest
                  ? "Verify & place order"
                  : "Confirm Order"}
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
                  BDT {(item.price_snapshot * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xl font-bold text-foreground">
            Total: BDT {total.toFixed(0)}
          </p>
          <p className="mt-1 text-xs text-muted">Prices include VAT</p>
        </Card>
      </div>
    </div>
  );
}
