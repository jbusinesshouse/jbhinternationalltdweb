"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";
import { calcOrderItemCount, calcOrderTotal, formatDate } from "@/lib/utils";

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
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_BORDER: Record<string, string> = {
  completed: "border-l-green-500",
  pending: "border-l-amber-500",
  processing: "border-l-blue-500",
  shipped: "border-l-indigo-500",
  cancelled: "border-l-red-500",
  hold: "border-l-orange-500",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-white p-5 shadow-sm"
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
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: products } = await supabase
      .from("products")
      .select("id")
      .eq("seller_id", user.id);

    if (!products?.length) {
      setOrders([]);
      return;
    }

    const ids = products.map((p) => p.id);
    const { data } = await supabase
      .from("orders")
      .select(
        `id, status, created_at, full_name, order_items (quantity, price_snapshot, product_name_snapshot)`
      )
      .in("product_id", ids)
      .order("created_at", { ascending: false });

    setOrders((data as OrderRow[]) ?? []);
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
    const totalRevenue = orders.reduce(
      (sum, o) => sum + calcOrderTotal(o.order_items),
      0
    );
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
        title="Sales Orders"
        description="Manage incoming orders from your customers"
        action={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface disabled:opacity-50"
          >
            <RefreshIcon spinning={refreshing} />
            Refresh
          </button>
        }
      />

      {!loading && orders.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Orders" value={stats.total} />
          <StatCard
            label="Active Orders"
            value={stats.active}
            sub="Needs attention"
          />
          <StatCard
            label="Total Sales"
            value={`৳${stats.revenue.toFixed(0)}`}
            sub="All orders"
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
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-foreground border border-border hover:bg-surface"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-75">
                  ({tabCounts[tab.key]})
                </span>
              </button>
            ))}
          </div>
          <input
            type="search"
            placeholder="Search customer or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="When customers place orders for your products, they will appear here. Make sure your products are listed and your store is active."
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="font-semibold text-foreground">No matching orders</p>
          <p className="mt-1 text-sm text-muted">
            Try a different filter or search term.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const total = calcOrderTotal(order.order_items);
            const itemCount = calcOrderItemCount(order.order_items);
            const firstProduct =
              order.order_items?.[0]?.product_name_snapshot ?? "Order";
            const moreCount =
              order.order_items && order.order_items.length > 1
                ? order.order_items.length - 1
                : 0;
            const borderColor =
              STATUS_BORDER[order.status?.toLowerCase()] ??
              "border-l-gray-300";
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
                  className={`rounded-xl border border-border border-l-4 ${borderColor} bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
                            +{moreCount} more
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDate(order.created_at)} · {itemCount} items
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-lg font-bold text-foreground">
                        ৳{total.toFixed(0)}
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
