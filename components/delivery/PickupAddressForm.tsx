"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { CourierLocationFields } from "@/components/delivery/CourierLocationFields";
import {
  CourierLocation,
  emptyCourierLocation,
  fetchPickupStore,
  PICKUP_STATUS_LABEL,
  PickupStore,
  savePickupStore,
} from "@/lib/courier";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted";

const LOCKED: PickupStore["status"][] = ["approved", "awaiting_pathao", "active"];

/** Seller's Pathao pickup address (one per seller, available after the first product). */
export function PickupAddressForm() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [store, setStore] = useState<PickupStore | null>(null);
  const [form, setForm] = useState({ contact_name: "", contact_number: "", secondary_contact: "", address: "" });
  const [location, setLocation] = useState<CourierLocation>(emptyCourierLocation());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const applyStore = (s: PickupStore | null) => {
    setStore(s);
    if (!s) return;
    setForm({
      contact_name: s.contact_name,
      contact_number: s.contact_number,
      secondary_contact: s.secondary_contact ?? "",
      address: s.address,
    });
    setLocation({ city_id: s.city_id, zone_id: s.zone_id, area_id: s.area_id });
  };

  useEffect(() => {
    fetchPickupStore()
      .then((res) => {
        setEnabled(res.enabled);
        setEligible(res.eligible);
        applyStore(res.store);
      })
      .catch((err: unknown) =>
        setMessage({ type: "error", text: err instanceof Error ? err.message : "লোড করা যায়নি।" })
      )
      .finally(() => setLoading(false));
  }, []);

  const locked = store ? LOCKED.includes(store.status) : false;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!location.city_id || !location.zone_id || !location.area_id) {
      setMessage({ type: "error", text: "শহর, জোন ও এরিয়া বাছাই করুন।" });
      return;
    }
    if (form.address.trim().length < 15) {
      setMessage({ type: "error", text: "পূর্ণ ঠিকানা দিন (কমপক্ষে ১৫ অক্ষর)।" });
      return;
    }
    setSaving(true);
    try {
      const res = await savePickupStore({
        contact_name: form.contact_name.trim(),
        contact_number: form.contact_number.trim(),
        secondary_contact: form.secondary_contact.trim() || null,
        address: form.address.trim(),
        city_id: location.city_id,
        zone_id: location.zone_id,
        area_id: location.area_id,
      });
      applyStore(res.store);
      setMessage({ type: "ok", text: "পিকআপ ঠিকানা জমা হয়েছে। অনুমোদন হলে আপনাকে জানানো হবে।" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "জমা দেওয়া যায়নি।" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-muted">লোড হচ্ছে...</p>;

  return (
    <div>
      <PageHeader
        title="কুরিয়ার পিকআপ ঠিকানা"
        description="Pathao এই ঠিকানা থেকে আপনার পার্সেল সংগ্রহ করবে"
      />
      {!enabled ? (
        <Card>
          <p className="text-muted">কুরিয়ার ডেলিভারি এখনো চালু হয়নি। চালু হলে এখানে পিকআপ ঠিকানা দিতে পারবেন।</p>
        </Card>
      ) : !eligible ? (
        <Card>
          <p className="font-semibold">আগে আপনার প্রথম পণ্য আপলোড করুন।</p>
          <p className="mt-1 text-sm text-muted">পণ্য আপলোডের পর পিকআপ ঠিকানা দিতে পারবেন।</p>
          <Button href="/product-upload" className="mt-4">নতুন পণ্য</Button>
        </Card>
      ) : (
        <Card>
          {store && (
            <div className="mb-4 rounded-xl bg-surface px-4 py-3 text-sm">
              <p className="font-bold">অবস্থা: {PICKUP_STATUS_LABEL[store.status] ?? store.status}</p>
              {store.admin_note && <p className="mt-1 text-muted">নোট: {store.admin_note}</p>}
              {locked && (
                <p className="mt-1 text-muted">ঠিকানা পরিবর্তন করতে সাপোর্টে যোগাযোগ করুন।</p>
              )}
            </div>
          )}
          <form onSubmit={submit} className="flex flex-col gap-4">
            <input
              required
              disabled={locked}
              minLength={3}
              maxLength={50}
              placeholder="যোগাযোগের ব্যক্তির নাম *"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              className={inputClass}
            />
            <input
              required
              disabled={locked}
              inputMode="tel"
              placeholder="মোবাইল নম্বর * (01XXXXXXXXX)"
              value={form.contact_number}
              onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))}
              className={inputClass}
            />
            <input
              disabled={locked}
              inputMode="tel"
              placeholder="বিকল্প নম্বর (ঐচ্ছিক)"
              value={form.secondary_contact}
              onChange={(e) => setForm((f) => ({ ...f, secondary_contact: e.target.value }))}
              className={inputClass}
            />
            {locked ? null : (
              <CourierLocationFields value={location} onChange={setLocation} mode="pickup" requireArea />
            )}
            <textarea
              required
              disabled={locked}
              minLength={15}
              maxLength={120}
              rows={3}
              placeholder="পূর্ণ ঠিকানা * (বাড়ি, রোড, এলাকা — ১৫-১২০ অক্ষর)"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={inputClass}
            />
            {message && (
              <p
                role="status"
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  message.type === "ok" ? "bg-teal-soft text-teal" : "bg-[#FEECEC] text-[#B42318]"
                }`}
              >
                {message.text}
              </p>
            )}
            {!locked && (
              <Button type="submit" disabled={saving} size="lg">
                {saving ? "জমা হচ্ছে…" : store ? "আবার জমা দিন" : "জমা দিন"}
              </Button>
            )}
          </form>
        </Card>
      )}
    </div>
  );
}
