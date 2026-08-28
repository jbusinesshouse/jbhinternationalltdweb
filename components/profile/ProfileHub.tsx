"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageElements";
import { normalizeProfile, type UserProfile } from "@/lib/profile";
import { LINKS } from "@/lib/constants";
import { uploadAvatarFile } from "@/lib/productMedia";
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadError("You are not signed in.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setLoadError("Profile not found.");
      setLoading(false);
      return;
    }

    const nextProfile = normalizeProfile(
      data as Record<string, unknown>,
      user
    );
    setProfile(nextProfile);
    setName(nextProfile.full_name ?? "");
    setLoading(false);
  };

  useEffect(() => {
    void loadProfile();
  }, [userId]);

  const isSeller = profile?.store_type === "wholesale";
  const isBuyer = profile?.store_type === "retail";
  const isActive = profile?.status === "active";
  const displayName = profile?.full_name || profile?.store_name || "User";

  const menuSections = useMemo(
    () => [
      {
        title: "Account",
        items: [{ href: "/account", label: "My Account" }],
      },
      {
        title: "Commerce",
        items: [
          ...(isSeller && isActive
            ? [{ href: "/product-upload", label: "Upload Product" }]
            : []),
          ...(isSeller
            ? [
                { href: "/sales", label: "Sales Orders" },
                { href: "/featured-request", label: "Store Promotion" },
                { href: "/advertise-product", label: "Advertise Product" },
              ]
            : []),
          ...(isBuyer ? [{ href: "/orders", label: "My Orders" }] : []),
        ],
      },
      {
        title: "Communication",
        items: [
          { href: "/messages", label: "Messages" },
          { href: "/notifications", label: "Notifications" },
        ],
      },
      {
        title: "More",
        items: [
          { href: "/hub", label: "Hub" },
          { href: "/content-creator-referral", label: "Content Creator Referral" },
          { href: "/support", label: "Support" },
          { href: "/about", label: "About" },
          { href: LINKS.privacyPolicy, label: "Privacy Policy", external: true },
          { href: LINKS.termsAndConditions, label: "Terms & Conditions", external: true },
        ],
      },
    ],
    [isSeller, isBuyer, isActive]
  );

  const handleSaveName = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) {
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
      const url = await uploadAvatarFile(profile.id, file);
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);
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
        <p className="text-sm text-muted">Loading your profile...</p>
      </Card>
    );
  }

  if (loadError || !profile) {
    return (
      <Card>
        <p className="text-sm text-red-600">
          {loadError ?? "Could not load your profile."}
        </p>
        <Button className="mt-4" onClick={() => void loadProfile()}>
          Try Again
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
          <label className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full bg-primary/10">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl font-bold text-primary">
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                ...
              </div>
            )}
          </label>

          <div className="flex-1">
            {!editMode ? (
              <>
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                <p className="text-sm text-muted">{userEmail}</p>
                <button
                  type="button"
                  onClick={() => {
                    setName(profile.full_name ?? "");
                    setEditMode(true);
                  }}
                  className="mt-2 text-sm font-semibold text-primary hover:underline"
                >
                  Edit Name
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                <Button size="sm" onClick={handleSaveName} disabled={saving}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {menuSections.map((section) =>
        section.items.length ? (
          <Card key={section.title} className="mb-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
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
                    className="flex items-center justify-between py-3 text-foreground hover:text-primary"
                  >
                    {item.label}
                    <span>→</span>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between py-3 text-foreground hover:text-primary"
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

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? "Signing out..." : "Logout"}
        </Button>
        <a
          href={APPEAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg border border-red-200 bg-red-50 py-3 text-center text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          Request Account Deletion
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
    const { error: updateError } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", profile.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await onSaved();
  };

  const missingFields = [
    !form.full_name && "Full Name",
    !form.phone && "Phone",
    !form.store_name && "Store Name",
    !form.address && "Address",
    !form.district && "District",
    !form.upazila && "Upazila",
  ].filter(Boolean);

  return (
    <Card>
      <h2 className="text-xl font-bold">Complete Your Profile</h2>
      <p className="mt-2 text-sm text-muted">
        A few details are still needed before you can use all features.
      </p>
      {missingFields.length > 0 && (
        <p className="mt-2 text-sm text-amber-600">
          Still needed: {missingFields.join(", ")}
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {(
          [
            ["full_name", "Full Name *"],
            ["phone", "Phone *"],
            ["store_name", "Store Name *"],
            ["address", "Address *"],
            ["district", "District *"],
            ["upazila", "Upazila *"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="text-sm font-medium">{label}</label>
            <input
              required
              value={form[key]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium">Account Type *</label>
          <select
            value={form.store_type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                store_type: e.target.value as "wholesale" | "retail",
              }))
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          >
            <option value="retail">Retail (Buyer)</option>
            <option value="wholesale">Wholesale (Seller)</option>
          </select>
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save & Continue"}
        </Button>
      </form>
    </Card>
  );
}
