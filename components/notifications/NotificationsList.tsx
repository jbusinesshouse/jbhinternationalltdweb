"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, PageHeader } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase/browser";
import { formatDate } from "@/lib/utils";

export function NotificationsList({ profile }: { profile: UserProfile }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleCancelAction = async (
    item: any,
    decision: "accept" | "reject"
  ) => {
    if (!item.order_id || item.action_completed) return;
    setActingId(item.id);
    const newStatus = decision === "accept" ? "cancelled" : "hold";
    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", item.order_id);
    await supabase
      .from("notifications")
      .update({ action_completed: true, is_read: true })
      .eq("id", item.id);
    setActingId(null);
    load();
  };

  const getOrderLink = (orderId: string) =>
    profile.store_type === "wholesale"
      ? `/sales/${orderId}`
      : `/orders/${orderId}`;

  return (
    <div>
      <PageHeader title="Notifications" />
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={!item.is_read ? "border-primary/40 bg-primary/5" : ""}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-muted whitespace-pre-line">
                    {item.message}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                {!item.is_read && (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              {item.type === "order_cancel_request" &&
                !item.action_completed && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={actingId === item.id}
                      onClick={() => handleCancelAction(item, "accept")}
                    >
                      Accept Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === item.id}
                      onClick={() => handleCancelAction(item, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              {item.order_id && (
                <Link
                  href={getOrderLink(item.order_id)}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  View order →
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
