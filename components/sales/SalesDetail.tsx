"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { apiRequest } from "@/lib/api";
import { calcOrderItemCount, calcOrderTotal, formatBdt, formatDate } from "@/lib/utils";

const STATUS_FLOW = ["pending", "processing", "shipped", "completed"] as const;

const STEP_LABEL: Record<string, string> = {
  pending: "নতুন",
  processing: "প্রসেসিং",
  shipped: "শিপড",
  completed: "সম্পন্ন",
};

type StatusOption = {
  key: string;
  label: string;
  desc: string;
  danger?: boolean;
};

const STATUS_OPTIONS: StatusOption[] = [
  { key: "processing", label: "প্রসেসিং", desc: "অর্ডার প্রস্তুত করা হচ্ছে" },
  { key: "shipped", label: "শিপড", desc: "অর্ডার পাঠিয়ে দেওয়া হয়েছে" },
  { key: "completed", label: "সম্পন্ন", desc: "ক্রেতার কাছে অর্ডার পৌঁছেছে" },
  { key: "cancelled", label: "বাতিল", desc: "ক্রেতার কাছে বাতিলের অনুরোধ পাঠান", danger: true },
];

type OrderItem = {
  quantity: number;
  price_snapshot: number;
  product_name_snapshot: string;
  product_variants?: { color?: string } | null;
  product_sizes?: { size?: string } | null;
};

type Order = {
  id: string;
  status: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  delivery_address: string;
  user_id: string;
  order_items: OrderItem[];
};

function BackIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function StatusTimeline({ status }: { status: string }) {
  const current = status?.toLowerCase();
  const isCancelled = current === "cancelled";
  const isHold = current === "hold";

  if (isCancelled || isHold) {
    return (
      <div
        className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          isHold
            ? "bg-[#FFF1D6] text-[#8A4B00]"
            : "bg-[#FEECEC] text-[#B42318]"
        }`}
      >
        {isHold
          ? "অর্ডারটি হোল্ডে আছে। সমস্যার সমাধান না হওয়া পর্যন্ত স্ট্যাটাস বদলানো যাবে না।"
          : "অর্ডারটি বাতিল করা হয়েছে।"}
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(
    current as typeof STATUS_FLOW[number]
  );

  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((step, idx) => {
        const isPast = idx <= currentIdx;
        const isCurrent = step === current;
        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isPast
                    ? isCurrent
                      ? "bg-primary text-primary-ink ring-4 ring-primary/20"
                      : "bg-primary-soft text-primary-strong"
                    : "bg-surface text-muted"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`mt-1.5 text-center text-xs font-semibold leading-tight ${
                  isPast ? "text-foreground" : "text-muted"
                }`}
              >
                {STEP_LABEL[step]}
              </span>
            </div>
            {idx < STATUS_FLOW.length - 1 && (
              <div
                className={`h-0.5 flex-1 -mt-5 ${
                  idx < currentIdx ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-white p-5"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-surface" />
          <div className="mt-4 space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-surface" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SalesDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = async () => {
    try {
      const res = await apiRequest<{ order: Order }>(`/sales/${orderId}`, { auth: true });
      setOrder(res.order);
    } catch {
      setOrder(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const askUpdateStatus = (status: string) => {
    if (!order || order.status?.toLowerCase() === "hold") return;
    if (order.status?.toLowerCase() === status) return;
    setPendingStatus(status);
  };

  const confirmUpdate = async () => {
    if (!order || !pendingStatus) return;
    const oldStatus = order.status;
    const isCancelRequest = pendingStatus === "cancelled";
    setUpdating(true);
    if (!isCancelRequest) {
      setOrder((prev) => (prev ? { ...prev, status: pendingStatus } : prev));
    }

    try {
      // The API handles side effects: cancel = ask the buyer, completed = review request.
      await apiRequest(`/sales/${order.id}/status`, {
        method: "PATCH",
        auth: true,
        body: { status: pendingStatus },
      });
      showMessage(
        "success",
        isCancelRequest
          ? "ক্রেতার কাছে বাতিলের অনুরোধ পাঠানো হয়েছে।"
          : `স্ট্যাটাস আপডেট হয়েছে: ${STEP_LABEL[pendingStatus] ?? pendingStatus}।`
      );
    } catch (err) {
      if (!isCancelRequest) {
        setOrder((prev) => (prev ? { ...prev, status: oldStatus } : prev));
      }
      showMessage(
        "error",
        err instanceof Error ? err.message : "স্ট্যাটাস আপডেট করা যায়নি। আবার চেষ্টা করুন।"
      );
    }

    setUpdating(false);
    setPendingStatus(null);
  };

  if (loading) return <DetailSkeleton />;
  if (!order) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <p className="font-bold">অর্ডারটি পাওয়া যায়নি</p>
        <Button href="/sales" variant="outline" size="sm" className="mt-4">
          বিক্রির তালিকায় ফিরুন
        </Button>
      </div>
    );
  }

  const isHold = order.status?.toLowerCase() === "hold";
  const total = calcOrderTotal(order.order_items);
  const itemCount = calcOrderItemCount(order.order_items);
  const shortId = order.id.slice(0, 8).toUpperCase();

  const pendingOption = STATUS_OPTIONS.find((o) => o.key === pendingStatus);

  return (
    <div>
      {message && (
        <div
          role="status"
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "bg-teal-soft text-teal"
              : "bg-[#FEECEC] text-[#B42318]"
          }`}
        >
          {message.text}
        </div>
      )}

      <PageHeader
        title="অর্ডারের বিবরণ"
        description={`অর্ডার #${shortId}`}
        action={
          <Button href="/sales" variant="outline" size="sm">
            <span className="flex items-center gap-1.5">
              <BackIcon />
              ফিরে যান
            </span>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Summary */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">ক্রেতা</p>
                <p className="text-xl font-extrabold text-foreground">
                  {order.full_name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={order.status} />
                <p className="mt-2 text-2xl font-extrabold text-foreground">
                  {formatBdt(total)}
                </p>
                <p className="text-sm text-muted">{itemCount.toLocaleString("bn-BD")} পিস</p>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card>
            <h3 className="font-extrabold text-foreground">অর্ডারের পণ্য</h3>
            <div className="mt-4 divide-y divide-border">
              {order.order_items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {item.product_name_snapshot}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {item.product_variants?.color && (
                        <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                          {item.product_variants.color}
                        </span>
                      )}
                      {item.product_sizes?.size && (
                        <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                          সাইজ {item.product_sizes.size}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {formatBdt(Number(item.price_snapshot))} × {item.quantity.toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-foreground">
                    {formatBdt(item.price_snapshot * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <span className="font-bold text-foreground">মোট</span>
              <span className="text-lg font-extrabold text-foreground">
                {formatBdt(total)}
              </span>
            </div>
          </Card>

          {/* Status */}
          <Card>
            <h3 className="font-extrabold text-foreground">অর্ডারের অবস্থা</h3>
            <div className="mt-4">
              <StatusTimeline status={order.status} />
            </div>

            {!isHold && order.status?.toLowerCase() !== "cancelled" && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-muted">
                  ক্রেতাকে জানাতে স্ট্যাটাস আপডেট করুন
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const isActive =
                      order.status?.toLowerCase() === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={updating || isActive}
                        onClick={() => askUpdateStatus(opt.key)}
                        className={`rounded-2xl border-2 p-3.5 text-left transition-colors ${
                          isActive
                            ? "border-primary bg-primary-soft"
                            : opt.danger
                              ? "border-border hover:border-[#B42318] hover:bg-[#FEECEC]"
                              : "border-border hover:border-primary hover:bg-surface"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <p
                          className={`text-sm font-bold ${
                            opt.danger ? "text-[#B42318]" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="font-extrabold text-foreground">ক্রেতা</h3>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-strong">
                  {(order.full_name || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <p className="font-medium text-foreground">{order.full_name}</p>
              </div>
              {order.phone && (
                <a
                  href={`tel:${order.phone}`}
                  className="flex items-center gap-2 text-sm text-primary-strong hover:underline"
                >
                  <PhoneIcon />
                  {order.phone}
                </a>
              )}
              {order.email && (
                <a
                  href={`mailto:${order.email}`}
                  className="flex items-center gap-2 text-sm text-primary-strong hover:underline"
                >
                  <MailIcon />
                  {order.email}
                </a>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-extrabold text-foreground">ডেলিভারি ঠিকানা</h3>
            <div className="mt-4 flex gap-2">
              <MapIcon />
              <div className="text-sm">
                <p className="font-medium text-foreground">{order.city}</p>
                <p className="mt-1 text-muted">{order.delivery_address}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-surface">
            <p className="text-sm text-muted">
              এই অর্ডার নিয়ে সাহায্য লাগবে?{" "}
              <Link href="/support" className="font-bold text-primary-strong hover:underline">
                সাপোর্টে জানান
              </Link>
            </p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={
          pendingStatus === "cancelled"
            ? "বাতিলের অনুরোধ পাঠান"
            : `স্ট্যাটাস বদলে "${STEP_LABEL[pendingStatus ?? ""] ?? pendingStatus}" করবেন?`
        }
        description={
          pendingStatus === "cancelled"
            ? "ক্রেতার কাছে বাতিলের অনুরোধ যাবে। তিনি রাজি হলেই অর্ডার বাতিল হবে।"
            : pendingOption?.desc
        }
        confirmLabel={
          pendingStatus === "cancelled" ? "অনুরোধ পাঠান" : "স্ট্যাটাস আপডেট করুন"
        }
        variant={pendingStatus === "cancelled" ? "danger" : "default"}
        loading={updating}
        onConfirm={confirmUpdate}
        onCancel={() => !updating && setPendingStatus(null)}
      />
    </div>
  );
}
