"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";
import { calcOrderItemCount, calcOrderTotal, formatDate } from "@/lib/utils";

const STATUS_FLOW = ["pending", "processing", "shipped", "completed"] as const;

type StatusOption = {
  key: string;
  label: string;
  desc: string;
  danger?: boolean;
};

const STATUS_OPTIONS: StatusOption[] = [
  { key: "processing", label: "Processing", desc: "Order is being prepared" },
  { key: "shipped", label: "Shipped", desc: "Order has been dispatched" },
  { key: "completed", label: "Completed", desc: "Order delivered to customer" },
  { key: "cancelled", label: "Cancel", desc: "Request cancellation from buyer", danger: true },
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
        className={`rounded-lg px-4 py-3 text-sm ${
          isHold
            ? "bg-orange-50 text-orange-800"
            : "bg-red-50 text-red-800"
        }`}
      >
        {isHold
          ? "This order is on hold. Status updates are locked until the issue is resolved."
          : "This order has been cancelled."}
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
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-primary/20 text-primary"
                    : "bg-surface text-muted"
                }`}
              >
                {idx + 1}
              </div>
              <span
                className={`mt-1.5 text-center text-[10px] font-medium capitalize leading-tight ${
                  isPast ? "text-foreground" : "text-muted"
                }`}
              >
                {step}
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
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-white p-5 shadow-sm"
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
    const { data } = await supabase
      .from("orders")
      .select(
        `*, order_items (quantity, price_snapshot, product_name_snapshot, product_variants (color), product_sizes (size))`
      )
      .eq("id", orderId)
      .single();
    setOrder(data as Order | null);
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

    if (pendingStatus === "cancelled") {
      setUpdating(true);
      try {
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("order_id", order.id)
          .eq("type", "order_cancel_request")
          .eq("action_completed", false)
          .limit(1);

        if (existing && existing.length > 0) {
          showMessage("error", "A cancellation request was already sent.");
          setPendingStatus(null);
          setUpdating(false);
          return;
        }

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order cancellation request",
          message:
            "The seller has requested to cancel this order. Do you accept?",
          type: "order_cancel_request",
          action_completed: false,
          order_id: order.id,
          is_read: false,
        });
        showMessage("success", "Cancellation request sent to the buyer.");
      } catch {
        showMessage("error", "Failed to send cancellation request.");
      }
      setUpdating(false);
      setPendingStatus(null);
      return;
    }

    const oldStatus = order.status;
    setUpdating(true);
    setOrder((prev) => (prev ? { ...prev, status: pendingStatus } : prev));

    const { error } = await supabase
      .from("orders")
      .update({ status: pendingStatus })
      .eq("id", order.id);

    if (error) {
      setOrder((prev) => (prev ? { ...prev, status: oldStatus } : prev));
      showMessage("error", "Failed to update status. Please try again.");
    } else {
      if (pendingStatus === "completed") {
        const productName =
          order.order_items?.[0]?.product_name_snapshot ?? "your order";
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order delivered — leave a review",
          message: `Your order for ${productName} is complete. Tap to rate the product.`,
          type: "order_review_request",
          order_id: order.id,
          is_read: false,
          action_completed: false,
        });
      }
      showMessage("success", `Status updated to ${pendingStatus}.`);
    }

    setUpdating(false);
    setPendingStatus(null);
  };

  if (loading) return <DetailSkeleton />;
  if (!order) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <p className="font-semibold">Order not found</p>
        <Button href="/sales" variant="outline" size="sm" className="mt-4">
          Back to Sales
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
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <PageHeader
        title="Order Details"
        description={`Order #${shortId}`}
        action={
          <Button href="/sales" variant="outline" size="sm">
            <span className="flex items-center gap-1.5">
              <BackIcon />
              Back
            </span>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Summary */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Customer</p>
                <p className="text-xl font-bold text-foreground">
                  {order.full_name}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={order.status} />
                <p className="mt-2 text-2xl font-bold text-foreground">
                  ৳{total.toFixed(2)}
                </p>
                <p className="text-sm text-muted">{itemCount} items</p>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card>
            <h3 className="font-semibold text-foreground">Order Items</h3>
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
                          Size {item.product_sizes.size}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      ৳{Number(item.price_snapshot).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-foreground">
                    ৳
                    {(item.price_snapshot * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">
                ৳{total.toFixed(2)}
              </span>
            </div>
          </Card>

          {/* Status */}
          <Card>
            <h3 className="font-semibold text-foreground">Order Status</h3>
            <div className="mt-4">
              <StatusTimeline status={order.status} />
            </div>

            {!isHold && order.status?.toLowerCase() !== "cancelled" && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-muted">
                  Update status to keep your customer informed
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
                        className={`rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : opt.danger
                              ? "border-border hover:border-red-300 hover:bg-red-50"
                              : "border-border hover:border-primary/40 hover:bg-surface"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <p
                          className={`text-sm font-semibold ${
                            opt.danger ? "text-red-700" : "text-foreground"
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
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-foreground">Customer</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <PhoneIcon />
                  {order.phone}
                </a>
              )}
              {order.email && (
                <a
                  href={`mailto:${order.email}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <MailIcon />
                  {order.email}
                </a>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-foreground">Delivery Address</h3>
            <div className="mt-4 flex gap-2">
              <MapIcon />
              <div className="text-sm">
                <p className="font-medium text-foreground">{order.city}</p>
                <p className="mt-1 text-muted">{order.delivery_address}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-surface/50">
            <p className="text-xs text-muted">
              Need help with this order?{" "}
              <Link href="/support" className="font-medium text-primary hover:underline">
                Contact support
              </Link>
            </p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={
          pendingStatus === "cancelled"
            ? "Request cancellation"
            : `Update to ${pendingStatus}`
        }
        description={
          pendingStatus === "cancelled"
            ? "This will send a cancellation request to the buyer. They must accept before the order is cancelled."
            : pendingOption?.desc
        }
        confirmLabel={
          pendingStatus === "cancelled" ? "Send request" : "Update status"
        }
        variant={pendingStatus === "cancelled" ? "danger" : "default"}
        loading={updating}
        onConfirm={confirmUpdate}
        onCancel={() => !updating && setPendingStatus(null)}
      />
    </div>
  );
}
