"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { authErrorMessage, errorBoxClass, inputClass, labelClass } from "@/components/ui/form";
import { DISTRICTS, getUpazilasForDistrict } from "@/lib/bdLocations";
import { LINKS } from "@/lib/constants";
import { apiRequest } from "@/lib/api";
import { uploadAvatarFile } from "@/lib/productMedia";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/profile";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState<"wholesale" | "retail">("retail");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableUpazilas = useMemo(
    () => getUpazilasForDistrict(district),
    [district]
  );

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleAvatarChange = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setUpazila("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setError("চালিয়ে যেতে শর্তাবলী ও প্রাইভেসি পলিসিতে টিক দিন।");
      return;
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedStoreName = storeName.trim();
    const trimmedAddress = address.trim();

    if (
      !trimmedFullName ||
      !trimmedEmail ||
      !trimmedPhone ||
      !password ||
      !trimmedStoreName ||
      !trimmedAddress ||
      !district ||
      !upazila
    ) {
      setError("* চিহ্নিত সব ঘর পূরণ করুন।");
      return;
    }

    if (password !== confirmPassword) {
      setError("দুটি পাসওয়ার্ড মিলছে না।");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      let referralCreatorId: string | null = null;
      const trimmedReferralCode = referralCode.trim();
      if (trimmedReferralCode) {
        const referral = await apiRequest<{ valid: boolean; creatorId: string | null }>(
          `/referral/validate/${encodeURIComponent(trimmedReferralCode)}`,
          { auth: false }
        );
        if (!referral.valid || !referral.creatorId) {
          setError("রেফারেল কোডটি সঠিক নয়।");
          setLoading(false);
          return;
        }

        referralCreatorId = referral.creatorId;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedFullName },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("অ্যাকাউন্ট তৈরি করা যায়নি।");

      const accessToken = authData.session?.access_token ?? null;
      if (!accessToken) {
        // Email confirmation is on in Supabase: the profile is created on first sign-in.
        throw new Error(
          "অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল কনফার্ম করে সাইন ইন করুন।"
        );
      }
      let avatarUrl: string | null = null;

      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatarFile(avatarFile, accessToken);
        } catch {
          // Continue without avatar, matching mobile behavior
        }
      }

      // The API sets status (wholesale accounts start restricted until an admin approves).
      await apiRequest("/profiles/me", {
        method: "PUT",
        auth: true,
        accessToken,
        body: {
          full_name: trimmedFullName,
          phone: trimmedPhone,
          store_name: trimmedStoreName,
          store_type: storeType,
          address: trimmedAddress,
          district,
          upazila,
          avatar_url: avatarUrl,
          referral_creator_id: referralCreatorId,
        },
      });

      window.location.href = "/products";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? authErrorMessage(err.message) : "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div role="alert" className={errorBoxClass}>
          {error}
        </div>
      )}

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#D1D5DB] bg-surface px-2 text-center text-xs font-semibold text-muted hover:border-primary"
        >
          {avatarPreview ? (
            <Image src={avatarPreview} alt="প্রোফাইল ছবির প্রিভিউ" fill className="object-cover" unoptimized />
          ) : (
            "ছবি দিন"
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
        />
        <p className="mt-2 text-xs text-muted">ঐচ্ছিক</p>
      </div>

      <div>
        <label htmlFor="su-name" className={labelClass}>পুরো নাম *</label>
        <input id="su-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} autoComplete="name" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="su-email" className={labelClass}>ইমেইল *</label>
          <input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoCapitalize="none" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="su-phone" className={labelClass}>মোবাইল নম্বর *</label>
          <input id="su-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="01XXXXXXXXX" autoComplete="tel" required />
        </div>
      </div>

      <div>
        <label className={labelClass}>অ্যাকাউন্টের ধরন *</label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "retail", title: "খুচরা · Retail", body: "কিনতে ও বিক্রি করতে" },
              { value: "wholesale", title: "পাইকারি · Wholesale", body: "অ্যাডমিন অনুমোদনের পর বিক্রি চালু" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={storeType === opt.value}
              onClick={() => setStoreType(opt.value)}
              className={`flex flex-col gap-0.5 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                storeType === opt.value ? "border-primary bg-primary-soft" : "border-border bg-white hover:border-primary/60"
              }`}
            >
              <span className="text-[15px] font-bold">{opt.title}</span>
              <span className="text-xs text-muted">{opt.body}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="su-store" className={labelClass}>দোকান / গুদামের নাম *</label>
        <input id="su-store" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClass} required />
      </div>

      <div>
        <label htmlFor="su-address" className={labelClass}>ঠিকানা *</label>
        <input id="su-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} autoComplete="street-address" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="su-district" className={labelClass}>জেলা *</label>
          <select id="su-district" value={district} onChange={(e) => handleDistrictChange(e.target.value)} className={inputClass} required>
            <option value="">জেলা বাছাই করুন</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="su-upazila" className={labelClass}>উপজেলা *</label>
          <select id="su-upazila" value={upazila} onChange={(e) => setUpazila(e.target.value)} className={inputClass} disabled={!district} required>
            <option value="">উপজেলা বাছাই করুন</option>
            {availableUpazilas.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="su-pass" className={labelClass}>পাসওয়ার্ড *</label>
          <input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="new-password" required minLength={6} />
        </div>
        <div>
          <label htmlFor="su-pass2" className={labelClass}>পাসওয়ার্ড আবার *</label>
          <input id="su-pass2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} autoComplete="new-password" required minLength={6} />
        </div>
      </div>

      <div>
        <label htmlFor="su-ref" className={labelClass}>রেফারেল কোড (ঐচ্ছিক)</label>
        <input id="su-ref" type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className={inputClass} autoCapitalize="none" />
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[#F5832B]"
        />
        <span>
          আমি{" "}
          <Link href={LINKS.termsAndConditions} className="font-semibold text-primary-strong hover:underline">শর্তাবলী</Link>{" "}
          ও{" "}
          <Link href={LINKS.privacyPolicy} className="font-semibold text-primary-strong hover:underline">প্রাইভেসি পলিসি</Link>{" "}
          মেনে নিচ্ছি।
        </span>
      </label>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "অ্যাকাউন্ট তৈরি হচ্ছে..." : "অ্যাকাউন্ট খুলুন"}
      </Button>

      <p className="text-center text-sm text-muted">
        আগেই অ্যাকাউন্ট আছে?{" "}
        <Link href="/sign-in" className="font-bold text-primary-strong hover:underline">সাইন ইন</Link>
      </p>
    </form>
  );
}
