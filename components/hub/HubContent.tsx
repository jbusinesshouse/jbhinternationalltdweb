"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import { LINKS } from "@/lib/constants";
import {
  fetchPlatformFeeSummary,
  formatBdt,
  PLATFORM_BKASH_NUMBER,
  submitPlatformFeePayment,
} from "@/lib/platformFee";

export function HubContent({ profile }: { profile: UserProfile }) {
  const isSeller = profile.store_type === "wholesale";

  if (!isSeller) {
    return (
      <div>
        <PageHeader
          title="Hub"
          description="Guides and quick links for retailers"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { href: "/orders", label: "My Orders", desc: "Track your purchases" },
            { href: "/support", label: "Support", desc: "Get help from our team" },
            { href: "/about", label: "About", desc: "Learn about JBH" },
            { href: LINKS.privacyPolicy, label: "Privacy Policy", desc: "How we handle data", external: true },
            { href: LINKS.termsAndConditions, label: "Terms", desc: "Platform terms", external: true },
          ].map((item) => (
            <Card key={item.label}>
              {"external" in item && item.external ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-muted">{item.desc}</p>
                </a>
              ) : (
                <Link href={item.href}>
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-muted">{item.desc}</p>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return <WholesaleHub profile={profile} />;
}

function WholesaleHub({ profile }: { profile: UserProfile }) {
  const [summary, setSummary] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [txRef, setTxRef] = useState("");
  const [bkash, setBkash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformFeeSummary(profile.id).then(setSummary);
  }, [profile.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!summary) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await submitPlatformFeePayment({
        sellerId: profile.id,
        amountBdt: Number(amount),
        bkashNumber: bkash,
        transactionReference: txRef,
        salesTotalSnapshot: summary.salesTotal,
        feeFromSalesSnapshot: summary.feeFromSales,
        feeDueSnapshot: summary.outstanding,
        approvedPaidSnapshot: summary.approvedPaid,
      });
      setMessage("Payment proof submitted. Awaiting approval.");
      setAmount("");
      setTxRef("");
      setBkash("");
      fetchPlatformFeeSummary(profile.id).then(setSummary);
    } catch (err: any) {
      setMessage(err.message || "Submission failed");
    }
    setSubmitting(false);
  };

  return (
    <div>
      <PageHeader
        title="Seller Hub"
        description="Platform fees, sales, and seller tools"
      />
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Completed Sales", formatBdt(summary.salesTotal)],
            ["Fee (2%)", formatBdt(summary.feeFromSales)],
            ["Paid", formatBdt(summary.approvedPaid)],
            ["Outstanding", formatBdt(summary.outstanding)],
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-xs text-muted">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <h3 className="font-semibold">Pay Platform Fee via bKash</h3>
        <p className="mt-2 text-sm text-muted">
          Send Money to: <strong>{PLATFORM_BKASH_NUMBER}</strong>
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            required
            type="number"
            placeholder="Amount (BDT)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <input
            required
            placeholder="Your bKash number"
            value={bkash}
            onChange={(e) => setBkash(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <input
            required
            placeholder="Transaction reference"
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Payment Proof"}
          </Button>
          {message && <p className="text-sm text-primary">{message}</p>}
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button href="/sales">View Sales Orders</Button>
        <Button href="/product-upload" variant="outline">
          Upload Product
        </Button>
        <Button href="/featured-request" variant="outline">
          Store Promotion
        </Button>
        <Button href="/advertise-product" variant="outline">
          Advertise Product
        </Button>
      </div>
    </div>
  );
}
