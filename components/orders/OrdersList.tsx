"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { apiRequest } from "@/lib/api";
import { calcOrderItemCount, calcOrderTotal, formatBdt, formatDate } from "@/lib/utils";

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
    try {
      const res = await apiRequest<{ orders: OrderRow[] }>("/orders", { auth: true });
      setOrders(res.orders ?? []);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader title="আমার অর্ডার" description="আপনার কেনা অর্ডারগুলো এখানে ট্র্যাক করুন" />
      {loading ? (
        <p className="text-muted">লোড হচ্ছে...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="এখনো কোনো অর্ডার নেই"
          description="অর্ডার করলে সেগুলো এখানে দেখা যাবে।"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-colors hover:border-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {order.order_items?.[0]?.product_name_snapshot ||
                        "অর্ডার"}
                      {order.order_items && order.order_items.length > 1
                        ? ` +আরও ${(order.order_items.length - 1).toLocaleString("bn-BD")}টি`
                        : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(order.created_at)} ·{" "}
                      {calcOrderItemCount(order.order_items).toLocaleString("bn-BD")} পিস
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-2 font-bold">
                      {formatBdt(calcOrderTotal(order.order_items))}
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
