"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageElements";
import { canSell } from "@/lib/accountStatus";
import { normalizeProfile, type UserProfile } from "@/lib/profile";
import { LINKS } from "@/lib/constants";
import { uploadAvatarFile } from "@/lib/productMedia";
import { isProductListingAccount } from "@/lib/moqRules";
import { apiRequest } from "@/lib/api";
import { supabase } from "@/lib/supabase/browser";
import { isProfileComplete } from "@/lib/utils";

const APPEAL_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScGFD5Rbyao72nTABzxEuQd8UVU97W5CP2eHwnQEeBsG_oLrw/viewform?usp=dialog";

type ProfileHubProps = {
  userId: string;
  userEmail: string;
};

export function ProfileHub({ userId, userEmail }: ProfileHubProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setLoadError(null);

    let data: Record<string, unknown> | null = null;
    try {
      const res = await apiRequest<{ profile: Record<string, unknown> | null }>(
        "/profiles/me",
        { auth: true }
      );
      data = res.profile;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "আপনি সাইন ইন করা নেই।");
      setLoading(false);
      return;
    }

    if (!data) {
      setLoadError("প্রোফাইল পাওয়া যায়নি।");
      setLoading(false);
      return;
    }

    const normalized = normalizeProfile(data as Record<string, unknown>);
    const nextProfile = { ...normalized, email: normalized.email ?? userEmail };
    setProfile(nextProfile);
    setName(nextProfile.full_name ?? "");
    setLoading(false);
  };

  useEffect(() => {
    void loadProfile();
  }, [userId]);

  const isSeller = profile?.store_type === "wholesale";
  const canUploadProducts =
    isProductListingAccount(profile?.store_type) && canSell(profile?.status);
  const displayName = profile?.full_name || profile?.store_name || "ব্যবহারকারী";

  const menuSections = useMemo(
    () => [
      {
        title: "অ্যাকাউন্ট",
        items: [{ href: "/account", label: "আমার অ্যাকাউন্ট" }],
      },
      {
        title: "কেনাবেচা",
        items: [
          ...(canUploadProducts
            ? [{ href: "/product-upload", label: "নতুন পণ্য আপলোড" }]
            : []),
          ...(isSeller
            ? [
                { href: "/sales", label: "বিক্রি ও অর্ডার" },
                { href: "/featured-request", label: "ফিচার্ড স্টোর" },
                { href: "/advertise-product", label: "পণ্যের বিজ্ঞাপন" },
              ]
            : []),
          { href: "/orders", label: "আমার অর্ডার" },
        ],
      },
      {
        title: "যোগাযোগ",
        items: [
          { href: "/messages", label: "মেসেজ" },
          { href: "/notifications", label: "নোটিফিকেশন" },
        ],
      },
      {
        title: "আরও",
        items: [
          { href: "/hub", label: "সেলার হাব" },
          { href: "/content-creator-referral", label: "কনটেন্ট ক্রিয়েটর রেফারেল" },
          { href: "/support", label: "সাহায্য" },
          { href: "/about", label: "আমাদের সম্পর্কে" },
          { href: LINKS.privacyPolicy, label: "প্রাইভেসি পলিসি" },
          { href: LINKS.termsAndConditions, label: "শর্তাবলী" },
        ],
      },
    ],
    [isSeller, canUploadProducts]
  );

  const handleSaveName = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);
    let ok = true;
    try {
      await apiRequest("/profiles/me", {
        method: "PATCH",
        auth: true,
        body: { full_name: name.trim() },
      });
    } catch {
      ok = false;
    }
    setSaving(false);
    if (ok) {
      setEditMode(false);
      await loadProfile();
      router.refresh();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const url = await uploadAvatarFile(file);
      await apiRequest("/profiles/me", {
        method: "PATCH",
        auth: true,
        body: { avatar_url: url },
      });
      await loadProfile();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted">প্রোফাইল লোড হচ্ছে...</p>
      </Card>
    );
  }

  if (loadError || !profile) {
    return (
      <Card>
        <p className="text-sm text-[#B42318]">
          {loadError ?? "প্রোফাইল লোড করা যায়নি।"}
        </p>
        <Button className="mt-4" onClick={() => void loadProfile()}>
          আবার চেষ্টা করুন
        </Button>
      </Card>
    );
  }

  if (!isProfileComplete(profile)) {
    return (
      <CompleteProfileForm
        profile={profile}
        onSaved={async () => {
          await loadProfile();
          router.refresh();
        }}
      />
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <label className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full bg-primary-soft">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl font-bold text-primary-strong">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center bg-navy/40 text-xs text-white">
                ...
              </div>
            )}
          </label>

          <div className="flex-1">
            {!editMode ? (
              <>
                <h2 className="text-xl font-extrabold">{profile.full_name}</h2>
                <p className="text-sm text-muted">{userEmail}</p>
                <button
                  type="button"
                  onClick={() => {
                    setName(profile.full_name ?? "");
                    setEditMode(true);
                  }}
                  className="mt-2 text-sm font-semibold text-primary-strong hover:underline"
                >
                  নাম বদলান
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
                />
                <Button size="sm" onClick={handleSaveName} disabled={saving}>
                  সেভ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  বাতিল
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {menuSections.map((section) =>
        section.items.length ? (
          <Card key={section.title} className="mb-4">
            <h3 className="mb-3 text-xs font-bold tracking-[0.08em] text-muted">
              {section.title}
            </h3>
            <div className="divide-y divide-border">
              {section.items.map((item) =>
                "external" in item && item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-3 text-foreground hover:text-primary-strong"
                  >
                    {item.label}
                    <span>→</span>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between py-3 text-foreground hover:text-primary-strong"
                  >
                    {item.label}
                    <span>→</span>
                  </Link>
                )
              )}
            </div>
          </Card>
        ) : null
      )}

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "সাইন আউট হচ্ছে..." : "সাইন আউট"}
        </Button>
        <a
          href={APPEAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-[#FEECEC] py-3 text-center text-sm font-bold text-[#B42318] hover:bg-[#FBD9D9]"
        >
          অ্যাকাউন্ট বন্ধ
        </a>
      </div>
    </div>
  );
}

function CompleteProfileForm({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    store_name: profile.store_name ?? "",
    store_type: (profile.store_type ?? "retail") as "wholesale" | "retail",
    address: profile.address ?? "",
    district: profile.district ?? "",
    upazila: profile.upazila ?? "",
  });

  useEffect(() => {
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      store_name: profile.store_name ?? "",
      store_type: (profile.store_type ?? "retail") as "wholesale" | "retail",
      address: profile.address ?? "",
      district: profile.district ?? "",
      upazila: profile.upazila ?? "",
    });
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // store_type and status are locked server-side; never send them.
      const { store_type: _storeType, ...editable } = form;
      void _storeType;
      await apiRequest("/profiles/me", {
        method: "PATCH",
        auth: true,
        body: {
          ...editable,
          store_name: editable.store_name || null,
          address: editable.address || null,
          district: editable.district || null,
          upazila: editable.upazila || null,
        },
      });
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "প্রোফাইল সেভ করা যায়নি।");
      return;
    }
    setSaving(false);
    await onSaved();
  };

  const missingFields = [
    !form.full_name && "পুরো নাম",
    !form.phone && "মোবাইল নম্বর",
    !form.store_name && "দোকানের নাম",
    !form.address && "ঠিকানা",
    !form.district && "জেলা",
    !form.upazila && "উপজেলা",
  ].filter(Boolean);

  return (
    <Card>
      <h2 className="text-xl font-extrabold">প্রোফাইল সম্পূর্ণ করুন</h2>
      <p className="mt-2 text-sm text-muted">
        সব ফিচার ব্যবহার করতে আর কয়েকটি তথ্য দরকার।
      </p>
      {missingFields.length > 0 && (
        <p className="mt-2 text-sm text-moq">
          বাকি আছে: {missingFields.join(", ")}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-xl bg-[#FEECEC] px-4 py-3 text-sm font-semibold text-[#B42318]">
            {error}
          </p>
        )}
        {(
          [
            ["full_name", "পুরো নাম *"],
            ["phone", "মোবাইল নম্বর *"],
            ["store_name", "দোকানের নাম *"],
            ["address", "ঠিকানা *"],
            ["district", "জেলা *"],
            ["upazila", "উপজেলা *"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="text-sm font-bold">{label}</label>
            <input
              required
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-bold">অ্যাকাউন্টের ধরন</label>
          <p className="mt-1 rounded-xl bg-surface px-4 py-2.5 text-[15px] font-semibold">
            {form.store_type === "wholesale" ? "পাইকারি · Wholesale" : "খুচরা · Retail"}
          </p>
          <p className="mt-1 text-xs text-muted">
            অ্যাকাউন্টের ধরন সাইন আপের সময় ঠিক হয় এবং এখান থেকে বদলানো যায় না। বদলাতে চাইলে সাপোর্টে যোগাযোগ করুন।
          </p>
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "সেভ হচ্ছে..." : "সেভ করে এগিয়ে যান"}
        </Button>
      </form>
    </Card>
  );
}
