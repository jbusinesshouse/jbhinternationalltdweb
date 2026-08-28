"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";
import { calcOrderItemCount, calcOrderTotal, formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export function SalesDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select(
        `*, order_items (quantity, price_snapshot, product_name_snapshot, product_variants (color), product_sizes (size))`
      )
      .eq("id", orderId)
      .single();
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const updateStatus = async (status: string) => {
    if (!order || order.status?.toLowerCase() === "hold") return;

    if (status === "cancelled") {
      if (!confirm("Send cancellation request to buyer?")) return;
      setUpdating(true);
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
      setUpdating(false);
      alert("Cancellation request sent to buyer.");
      return;
    }

    setUpdating(true);
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id);
    if (!error) {
      if (status === "completed") {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Order delivered — leave a review",
          message: "Your order is complete. Tap to rate the product.",
          type: "order_review_request",
          order_id: order.id,
          is_read: false,
          action_completed: false,
        });
      }
      await load();
    }
    setUpdating(false);
  };

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!order) return <p>Order not found</p>;

  const isHold = order.status?.toLowerCase() === "hold";

  return (
    <div>
      <PageHeader
        title="Sales Order"
        action={
          <Button href="/sales" variant="outline" size="sm">
            Back
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{order.full_name}</p>
              <p className="text-sm text-muted">{formatDate(order.created_at)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-3 text-xl font-bold">
            BDT {calcOrderTotal(order.order_items).toFixed(2)}
          </p>
          <p className="text-sm text-muted">
            {calcOrderItemCount(order.order_items)} items
          </p>
        </Card>

        <Card>
          <h3 className="font-semibold">Customer</h3>
          <p className="mt-2 text-sm">{order.full_name}</p>
          <p className="text-sm text-muted">{order.phone}</p>
          <p className="text-sm text-muted">{order.email}</p>
          <p className="mt-2 text-sm">
            {order.delivery_address}, {order.city}
          </p>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Update Status</h3>
          {isHold ? (
            <p className="text-sm text-orange-600">
              Order is on hold. Status updates are locked.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={
                    order.status?.toLowerCase() === status
                      ? "primary"
                      : "outline"
                  }
                  disabled={updating}
                  onClick={() => updateStatus(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
