"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { apiRequest } from "@/lib/api";
import { calcOrderItemCount, calcOrderTotal, formatBdt, formatDate } from "@/lib/utils";

type OrderItem = {
  quantity: number;
  price_snapshot: number;
  product_name_snapshot: string;
};

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  full_name: string;
  order_items: OrderItem[];
};

type FilterTab = "all" | "active" | "completed" | "cancelled";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "সব" },
  { key: "active", label: "চলমান" },
  { key: "completed", label: "সম্পন্ন" },
  { key: "cancelled", label: "বাতিল" },
];

const STATUS_BORDER: Record<string, string> = {
  completed: "border-l-[#0F766E]",
  pending: "border-l-[#F5832B]",
  processing: "border-l-[#12213F]",
  shipped: "border-l-[#6D5BD0]",
  cancelled: "border-l-[#B42318]",
  hold: "border-l-[#B7791F]",
};

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-white p-5"
        >
          <div className="flex gap-4">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-surface" />
              <div className="h-3 w-56 animate-pulse rounded bg-surface" />
              <div className="h-3 w-32 animate-pulse rounded bg-surface" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-6 w-20 animate-pulse rounded-full bg-surface" />
              <div className="h-4 w-16 animate-pulse rounded bg-surface ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-5 w-5 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export function SalesList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiRequest<{ orders: OrderRow[] }>("/sales", { auth: true });
      setOrders(res.orders ?? []);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    // Cancelled orders are not sales.
    const totalRevenue = orders
      .filter((o) => o.status?.toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + calcOrderTotal(o.order_items), 0);
    const activeCount = orders.filter(
      (o) =>
        !["completed", "cancelled"].includes(o.status?.toLowerCase() ?? "")
    ).length;
    return { total: orders.length, active: activeCount, revenue: totalRevenue };
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders;

    if (filter === "active") {
      list = list.filter(
        (o) =>
          !["completed", "cancelled"].includes(o.status?.toLowerCase() ?? "")
      );
    } else if (filter === "completed") {
      list = list.filter((o) => o.status?.toLowerCase() === "completed");
    } else if (filter === "cancelled") {
      list = list.filter((o) => o.status?.toLowerCase() === "cancelled");
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.full_name?.toLowerCase().includes(q) ||
          o.order_items?.some((item) =>
            item.product_name_snapshot?.toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [orders, filter, search]);

  const tabCounts = useMemo(() => {
    const active = orders.filter(
      (o) =>
        !["completed", "cancelled"].includes(o.status?.toLowerCase() ?? "")
    ).length;
    const completed = orders.filter(
      (o) => o.status?.toLowerCase() === "completed"
    ).length;
    const cancelled = orders.filter(
      (o) => o.status?.toLowerCase() === "cancelled"
    ).length;
    return { all: orders.length, active, completed, cancelled };
  }, [orders]);

  return (
    <div>
      <PageHeader
        title="বিক্রি ও অর্ডার"
        description="ক্রেতাদের পাঠানো অর্ডার এখান থেকে ম্যানেজ করুন"
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 text-sm font-bold text-foreground transition-colors hover:border-primary disabled:opacity-50"
          >
            <RefreshIcon spinning={refreshing} />
            রিফ্রেশ
          </button>
        }
      />

      {!loading && orders.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="মোট অর্ডার" value={stats.total.toLocaleString("bn-BD")} />
          <StatCard
            label="চলমান অর্ডার"
            value={stats.active.toLocaleString("bn-BD")}
            sub="মনোযোগ দরকার"
          />
          <StatCard
            label="মোট বিক্রি"
            value={formatBdt(stats.revenue)}
            sub="বাতিল ছাড়া সব অর্ডার"
          />
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  filter === tab.key
                    ? "border-primary bg-primary-soft text-moq"
                    : "border-border bg-white text-foreground hover:border-primary"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-75">
                  ({tabCounts[tab.key].toLocaleString("bn-BD")})
                </span>
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="ক্রেতা বা পণ্য খুঁজুন…"
            aria-label="ক্রেতা বা পণ্য খুঁজুন"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted"
          />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          title="এখনো কোনো বিক্রি নেই"
          description="ক্রেতারা আপনার পণ্যে অর্ডার করলে সেগুলো এখানে দেখা যাবে। পণ্য লিস্টেড আছে কি না এবং দোকান সক্রিয় আছে কি না দেখে নিন।"
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-6 py-12 text-center">
          <p className="font-bold text-foreground">মিলছে এমন কোনো অর্ডার নেই</p>
          <p className="mt-1 text-sm text-muted">অন্য ফিল্টার বা শব্দ দিয়ে খুঁজে দেখুন।</p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
            className="mt-4 text-sm font-bold text-primary-strong hover:underline"
          >
            ফিল্টার মুছুন
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const total = calcOrderTotal(order.order_items);
            const itemCount = calcOrderItemCount(order.order_items);
            const firstProduct =
              order.order_items?.[0]?.product_name_snapshot ?? "অর্ডার";
            const moreCount =
              order.order_items && order.order_items.length > 1
                ? order.order_items.length - 1
                : 0;
            const borderColor =
              STATUS_BORDER[order.status?.toLowerCase()] ??
              "border-l-[#D1D5DB]";
            const initials = (order.full_name || "C")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={order.id}
                href={`/sales/${order.id}`}
                className="group block"
              >
                <div
                  className={`rounded-2xl border border-border border-l-4 ${borderColor} bg-white p-4 transition-colors hover:border-primary`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary-strong">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {order.full_name}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm text-foreground">
                        {firstProduct}
                        {moreCount > 0 && (
                          <span className="text-muted">
                            {" "}
                            +আরও {moreCount.toLocaleString("bn-BD")}টি
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(order.created_at)} · {itemCount.toLocaleString("bn-BD")} পিস
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-lg font-bold text-foreground">
                        {formatBdt(total)}
                      </p>
                      <ChevronRight />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
