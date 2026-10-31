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
import {
  apiRequest,
  newIdempotencyKey,
  placeGuestOrder,
  requestGuestOrderOtp,
} from "@/lib/api";

type AddressMode = "store" | "saved" | "custom";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted";

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
        <p className="font-semibold">চেকআউটের তথ্য পাওয়া যায়নি। অনুগ্রহ করে পণ্যের পেজ থেকে শুরু করুন।</p>
        <Button href="/products" className="mt-4">
          পণ্য দেখুন
        </Button>
      </Card>
    );
  }

  const handleSendOtp = async () => {
    setFormError(null);
    if (!form.phone.trim()) {
      setFormError("কোড পেতে আপনার মোবাইল নম্বর দিন।");
      return;
    }
    setOtpSending(true);
    try {
      const res = await requestGuestOrderOtp(form.phone.trim());
      setOtpSent(true);
      setDebugOtp(res.debugOtp ?? null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "কোড পাঠানো যায়নি।");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (profile && !canPlaceOrders(profile)) {
      setFormError(
        orderBlockReason ?? "এই অ্যাকাউন্ট দিয়ে অর্ডার করা যাবে না।"
      );
      return;
    }
    if (!lineItems.length) {
      setFormError("আগে পণ্যের পরিমাণ বাছাই করুন।");
      return;
    }
    if (!form.full_name.trim() || !form.phone.trim()) {
      setFormError("নাম ও মোবাইল নম্বর দিতে হবে।");
      return;
    }

    const delivery = resolveDeliverySnapshot();
    if (!delivery) {
      setFormError(
        addressMode === "custom"
          ? "জেলা ও ঠিকানা দিতে হবে।"
          : "একটি সঠিক ডেলিভারি ঠিকানা বাছাই করুন।"
      );
      return;
    }

    if (isGuest && !otp.trim()) {
      setFormError("অর্ডার কনফার্ম করতে SMS-এ পাওয়া কোডটি দিন।");
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

      if (addressMode === "custom" && saveCustomAddress && profile) {
        const created = await createDeliveryAddress(profile.id, customForm);
        setSavedAddresses((prev) => [created, ...prev]);
        if (setCustomAsDefault) {
          await setDefaultDeliveryAddress(profile.id, created.id);
          setDefaultDeliveryAddressId(created.id);
        }
      }

      // One key per attempt: a retried request after a timeout never creates a second order.
      const res = await apiRequest<{ orderId?: string }>("/orders", {
        method: "POST",
        auth: true,
        idempotencyKey: newIdempotencyKey(),
        body: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          city: delivery.city,
          address: delivery.delivery_address,
          product_id: parsed.product.id,
          items: guestItems,
        },
      });
      router.push(`/orders/${res.orderId}`);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "অর্ডার করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const chipClass = (mode: AddressMode) =>
    `flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-colors ${
      addressMode === mode
        ? "border-primary bg-primary-soft text-foreground"
        : "border-border bg-white text-muted hover:border-primary/60"
    }`;

  return (
    <div>
      <PageHeader
        title="চেকআউট"
        description={
          isGuest
            ? "মোবাইল নম্বর দিয়েই অর্ডার করুন — অ্যাকাউন্ট লাগবে না"
            : "আপনার অর্ডার কনফার্ম করুন"
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isGuest && (
              <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm leading-relaxed text-[#3A2410]">
                অর্ডার কনফার্ম করতে আমরা একটি এককালীন SMS কোড পাঠাব। আগে থেকে অ্যাকাউন্ট থাকলে{" "}
                <Link href="/sign-in" className="font-bold text-primary-strong underline">
                  সাইন ইন করুন
                </Link>
                ।
              </p>
            )}

            <h3 className="text-lg font-extrabold">যোগাযোগ</h3>
            {(["full_name", "phone", "email"] as const).map((key) => (
              <input
                key={key}
                required={key !== "email"}
                placeholder={
                  key === "full_name"
                    ? "পুরো নাম *"
                    : key === "phone"
                      ? "মোবাইল নম্বর * (01XXXXXXXXX)"
                      : "ইমেইল (ঐচ্ছিক)"
                }
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className={inputClass}
              />
            ))}

            {isGuest && (
              <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                <h3 className="font-extrabold">SMS ভেরিফিকেশন</h3>
                <p className="text-sm text-muted">অর্ডার করার আগে আপনার নম্বরটি কনফার্ম করুন।</p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={otpSending || !form.phone.trim()}
                  onClick={() => void handleSendOtp()}
                >
                  {otpSending
                    ? "পাঠানো হচ্ছে…"
                    : otpSent
                      ? "আবার কোড পাঠান"
                      : "কোড পাঠান"}
                </Button>
                {otpSent && (
                  <input
                    required
                    inputMode="numeric"
                    placeholder="৬ সংখ্যার কোড দিন *"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={inputClass}
                  />
                )}
                {debugOtp && (
                  <p className="text-xs text-[#8A4B00]">
                    টেস্ট কোড (SMS গেটওয়ে চালু নেই):{" "}
                    <span className="font-mono font-semibold">{debugOtp}</span>
                  </p>
                )}
              </div>
            )}

            <h3 className="text-lg font-extrabold">ডেলিভারি ঠিকানা</h3>
            {!isGuest && (
              <div className="flex gap-2">
                {(
                  [
                    ["store", "দোকানের ঠিকানা"],
                    ["saved", "সেভ করা"],
                    ["custom", "নতুন"],
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
              <div className="rounded-2xl border border-border bg-surface p-4">
                {storeSnapshot ? (
                  <>
                    <p className="font-bold">দোকানের ঠিকানায় ডেলিভারি</p>
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
                    আপনার দোকানের ঠিকানা অসম্পূর্ণ। সেভ করা বা নতুন ঠিকানা ব্যবহার করুন।
                  </p>
                )}
              </div>
            )}

            {!isGuest && addressMode === "saved" && (
              <div className="flex flex-col gap-3">
                {addressesLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-surface" />
                ) : savedAddresses.length === 0 ? (
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-sm text-muted">এখনো কোনো ডেলিভারি ঠিকানা সেভ করা নেই।</p>
                    <button
                      type="button"
                      onClick={() => setAddressMode("custom")}
                      className="mt-2 text-sm font-semibold text-primary-strong hover:underline"
                    >
                      নতুন ঠিকানা দিন
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
                        className={`w-full rounded-2xl border-2 p-4 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary-soft"
                            : "border-border bg-white hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold text-foreground">
                          {addr.label?.trim() || "সেভ করা ঠিকানা"}
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
              <div className="rounded-2xl border border-border p-4">
                <p className="font-bold">ডেলিভারি ঠিকানা</p>
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
                        className="h-4 w-4 rounded border-border text-primary-strong focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground">
                        পরের বার ব্যবহারের জন্য ঠিকানাটি সেভ করুন
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
                          className="h-4 w-4 rounded border-border text-primary-strong focus:ring-primary/20"
                        />
                        <span className="text-sm text-foreground">
                          এটি আমার ডিফল্ট ঠিকানা করুন
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>
            )}

            {formError && (
              <p role="alert" className="rounded-xl bg-[#FEECEC] px-4 py-3 text-sm font-semibold text-[#B42318]">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || (isGuest && !otpSent)}
              size="lg"
              className="w-full"
            >
              {submitting
                ? "অর্ডার হচ্ছে…"
                : isGuest
                  ? "কোড যাচাই করে অর্ডার করুন"
                  : "অর্ডার কনফার্ম করুন"}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-extrabold">অর্ডারের সারসংক্ষেপ</h3>
          <p className="mt-2 font-semibold">{parsed.product.name}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  {item.product_name_snapshot} × {item.quantity}
                </span>
                <span>
                  ৳{(item.price_snapshot * item.quantity).toLocaleString("bn-BD")}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="font-bold">মোট</span>
            <span className="text-2xl font-extrabold">৳{total.toLocaleString("bn-BD")}</span>
          </div>
          <p className="mt-1 text-xs text-muted">দাম ভ্যাটসহ</p>
        </Card>
      </div>
    </div>
  );
}
