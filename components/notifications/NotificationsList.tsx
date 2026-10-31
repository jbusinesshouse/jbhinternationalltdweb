"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, PageHeader } from "@/components/ui/PageElements";
import { UserProfile } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function NotificationsList({ profile }: { profile: UserProfile }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await apiRequest<{ notifications: any[] }>("/notifications", { auth: true });
      setItems(res.notifications ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await apiRequest(`/notifications/${id}/read`, { method: "PATCH", auth: true });
    } catch {
      void load();
    }
  };

  const handleCancelAction = async (item: any, decision: "accept" | "reject") => {
    if (!item.order_id || item.action_completed) return;
    setActingId(item.id);
    try {
      await apiRequest(`/orders/${item.order_id}/cancel-response`, {
        method: "POST",
        auth: true,
        body: { accept: decision === "accept", notificationId: item.id },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "অর্ডার আপডেট করা যায়নি।");
    }
    setActingId(null);
    void load();
  };

  const getOrderLink = (orderId: string) =>
    profile.store_type === "wholesale"
      ? `/sales/${orderId}`
      : `/orders/${orderId}`;

  return (
    <div>
      <PageHeader title="নোটিফিকেশন" />
      {loading ? (
        <p className="text-muted">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <EmptyState title="কোনো নোটিফিকেশন নেই" description="নতুন অর্ডার বা মেসেজ এলে এখানে দেখা যাবে।" />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={!item.is_read ? "border-primary bg-primary-soft" : ""}
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
                    className="text-xs text-primary-strong hover:underline"
                  >
                    পড়া হয়েছে
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
                      বাতিল মেনে নিন
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === item.id}
                      onClick={() => handleCancelAction(item, "reject")}
                    >
                      বাতিল চাই না
                    </Button>
                  </div>
                )}
              {item.order_id && (
                <Link
                  href={getOrderLink(item.order_id)}
                  className="mt-3 inline-block text-sm text-primary-strong hover:underline"
                >
                  অর্ডার দেখুন →
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
