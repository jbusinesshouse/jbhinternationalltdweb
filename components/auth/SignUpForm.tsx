"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DISTRICTS, getUpazilasForDistrict } from "@/lib/bdLocations";
import { LINKS } from "@/lib/constants";
import { uploadAvatarFile } from "@/lib/productMedia";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/profile";

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

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
      setError("Please accept the Terms & Conditions and Privacy Policy.");
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
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      let referralCreatorId: string | null = null;
      const trimmedReferralCode = referralCode.trim();
      if (trimmedReferralCode) {
        const { data: referralData, error: referralError } = await supabase.rpc(
          "get_referral_creator",
          { referral_code: trimmedReferralCode }
        );

        if (referralError) throw referralError;
        if (!referralData) {
          setError("Invalid referral code.");
          setLoading(false);
          return;
        }

        referralCreatorId = referralData as string;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedFullName },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Account could not be created.");

      const userId = authData.user.id;
      let avatarUrl: string | null = null;

      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatarFile(userId, avatarFile);
        } catch {
          // Continue without avatar, matching mobile behavior
        }
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: trimmedFullName,
        email: trimmedEmail,
        phone: trimmedPhone,
        store_name: trimmedStoreName,
        store_type: storeType,
        address: trimmedAddress,
        district,
        upazila,
        avatar_url: avatarUrl,
        referral_creator_id: referralCreatorId,
        status: "active",
      });

      if (profileError) throw profileError;

      window.location.href = "/products";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-surface text-sm text-muted"
        >
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Profile preview"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            "Pick Profile Image"
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
        />
        <p className="mt-2 text-xs text-muted">Optional</p>
      </div>

      <div>
        <label className="block text-sm font-medium">Full Name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoCapitalize="none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Phone *</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Store/Warehouse Name *</label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Address *</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">District *</label>
          <select
            value={district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select District</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Upazila *</label>
          <select
            value={upazila}
            onChange={(e) => setUpazila(e.target.value)}
            className={inputClass}
            disabled={!district}
            required
          >
            <option value="">Select Upazila</option>
            {availableUpazilas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Account Type *</label>
        <div className="mt-2 grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setStoreType("retail")}
            className={`px-4 py-3 text-sm font-semibold transition-colors ${
              storeType === "retail"
                ? "bg-foreground text-white"
                : "bg-white text-foreground hover:bg-surface"
            }`}
          >
            Retail
          </button>
          <button
            type="button"
            onClick={() => setStoreType("wholesale")}
            className={`border-l border-border px-4 py-3 text-sm font-semibold transition-colors ${
              storeType === "wholesale"
                ? "bg-foreground text-white"
                : "bg-white text-foreground hover:bg-surface"
            }`}
          >
            Wholesale
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Password *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Confirm Password *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            required
            minLength={6}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Referral Code (optional)</label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className={inputClass}
          autoCapitalize="none"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1"
        />
        <span>
          By checking the box, you agree to our{" "}
          <a
            href={LINKS.privacyPolicy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href={LINKS.termsAndConditions}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms & Conditions
          </a>
          .
        </span>
      </label>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
