"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import {
  fetchMyLatestReferralCreatorApplication,
  fetchMyReferralDashboard,
  ReferralCreatorPlatform,
  submitReferralCreatorApplication,
} from "@/lib/referralCreatorApplications";

const PLATFORMS: ReferralCreatorPlatform[] = [
  "facebook",
  "youtube",
  "tiktok",
  "instagram",
  "other",
];

export function ReferralCreatorForm({
  userId,
  defaultName,
}: {
  userId: string;
  defaultName: string;
}) {
  const [application, setApplication] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [form, setForm] = useState({
    fullName: defaultName,
    phone: "",
    platform: "facebook" as ReferralCreatorPlatform,
    profileUrl: "",
    followerCount: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyLatestReferralCreatorApplication(userId).then(setApplication);
    fetchMyReferralDashboard(userId).then(setDashboard);
  }, [userId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitReferralCreatorApplication({
        userId,
        fullName: form.fullName,
        phone: form.phone,
        platform: form.platform,
        profileUrl: form.profileUrl,
        followerCount: form.followerCount || null,
        message: form.message || null,
      });
      alert("আবেদন পাঠানো হয়েছে!");
      setApplication(await fetchMyLatestReferralCreatorApplication(userId));
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (dashboard) {
    return (
      <div>
        <PageHeader title="ক্রিয়েটর রেফারেল ড্যাশবোর্ড" />
        <Card>
          <p className="text-lg font-extrabold">কোড: {dashboard.creator.code}</p>
          <p className="text-sm text-muted">
            মোট সাইন আপ: {Number(dashboard.totalSignups).toLocaleString("bn-BD")}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {dashboard.signups.map((s: any) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-white px-4 py-3 text-[15px]"
              >
                {s.display_name} · {s.store_type === "wholesale" ? "পাইকারি" : s.store_type === "retail" ? "খুচরা" : s.store_type}
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (application?.status === "pending") {
    return (
      <Card>
        <StatusBadge status="pending" />
        <p className="mt-3">আপনার আবেদনটি যাচাইয়ের অপেক্ষায় আছে।</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="কনটেন্ট ক্রিয়েটর রেফারেল"
        description="রেফারেল ক্রিয়েটর হতে আবেদন করুন"
      />
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {(
            [
              ["fullName", "পুরো নাম"],
              ["phone", "মোবাইল নম্বর"],
              ["profileUrl", "প্রোফাইল লিংক"],
              ["followerCount", "ফলোয়ার সংখ্যা (ঐচ্ছিক)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-bold">{label}</label>
              <input
                required={key !== "followerCount"}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-bold">প্ল্যাটফর্ম</label>
            <select
              value={form.platform}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  platform: e.target.value as ReferralCreatorPlatform,
                }))
              }
              className="mt-1 w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, message: e.target.value }))
            }
            placeholder="বার্তা (ঐচ্ছিক)..."
            aria-label="বার্তা"
            rows={3}
            className="w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
          />
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "পাঠানো হচ্ছে..." : "আবেদন করুন"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
