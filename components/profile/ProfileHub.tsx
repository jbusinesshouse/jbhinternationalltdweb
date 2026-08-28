"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import { LINKS } from "@/lib/constants";
import { uploadAvatarFile } from "@/lib/productMedia";
import { supabase } from "@/lib/supabase/browser";
import { isProfileComplete } from "@/lib/utils";

const APPEAL_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScGFD5Rbyao72nTABzxEuQd8UVU97W5CP2eHwnQEeBsG_oLrw/viewform?usp=dialog";

type ProfileHubProps = {
  profile: UserProfile;
  userEmail: string;
};

export function ProfileHub({ profile, userEmail }: ProfileHubProps) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(profile.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isSeller = profile.store_type === "wholesale";
  const isBuyer = profile.store_type === "retail";
  const isActive = profile.status === "active";
  const displayName = profile.full_name || profile.store_name || "User";

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
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", profile.id);
    setSaving(false);
    if (!error) {
      setEditMode(false);
      router.refresh();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const url = await uploadAvatarFile(profile.id, file);
      await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", profile.id);
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

  if (!isProfileComplete(profile)) {
    return <CompleteProfileForm profile={profile} />;
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
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

function CompleteProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter();
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
    router.refresh();
  };

  return (
    <Card>
      <h2 className="text-xl font-bold">Complete Your Profile</h2>
      <p className="mt-2 text-sm text-muted">
        Please fill in the details below to continue using all features.
      </p>
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
