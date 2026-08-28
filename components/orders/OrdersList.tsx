"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";
import { calcOrderItemCount, calcOrderTotal, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  full_name: string;
  order_items: {
    quantity: number;
    price_snapshot: number;
    product_name_snapshot: string;
  }[];
};

export function OrdersList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select(
        `id, status, created_at, full_name, order_items (quantity, price_snapshot, product_name_snapshot)`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader title="My Orders" description="Track your purchase orders" />
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place orders, they will appear here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {order.order_items?.[0]?.product_name_snapshot ||
                        "Order"}
                      {order.order_items && order.order_items.length > 1
                        ? ` +${order.order_items.length - 1} more`
                        : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(order.created_at)} ·{" "}
                      {calcOrderItemCount(order.order_items)} items
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-2 font-bold">
                      BDT {calcOrderTotal(order.order_items).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
