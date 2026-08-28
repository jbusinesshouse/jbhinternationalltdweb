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
      alert("Application submitted!");
      setApplication(await fetchMyLatestReferralCreatorApplication(userId));
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (dashboard) {
    return (
      <div>
        <PageHeader title="Creator Referral Dashboard" />
        <Card>
          <p className="text-lg font-bold">Code: {dashboard.creator.code}</p>
          <p className="text-sm text-muted">
            Total signups: {dashboard.totalSignups}
          </p>
          <div className="mt-4 space-y-2">
            {dashboard.signups.map((s: any) => (
              <div
                key={s.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                {s.display_name} · {s.store_type}
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
        <p className="mt-3">Your application is under review.</p>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Content Creator Referral"
        description="Apply to become a referral creator"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            [
              ["fullName", "Full Name"],
              ["phone", "Phone"],
              ["profileUrl", "Profile URL"],
              ["followerCount", "Follower Count"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-medium">{label}</label>
              <input
                required={key !== "followerCount"}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium">Platform</label>
            <select
              value={form.platform}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  platform: e.target.value as ReferralCreatorPlatform,
                }))
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
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
            placeholder="Optional message..."
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Apply"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
