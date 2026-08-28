"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";
import { calcOrderItemCount, calcOrderTotal, formatDate } from "@/lib/utils";

export function SalesList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
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
        setLoading(false);
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
      setOrders(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Orders from your customers"
      />
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No sales yet"
          description="When customers place orders, they will appear here."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/sales/${order.id}`}>
              <Card className="hover:shadow-md">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.full_name}</p>
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
