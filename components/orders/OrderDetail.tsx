"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { apiRequest } from "@/lib/api";
import { calcOrderItemCount, calcOrderTotal, formatBdt, formatDate } from "@/lib/utils";

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest<{ order: any; seller: any }>(`/orders/${orderId}`, {
          auth: true,
        });
        setOrder(res.order);
        setSeller(res.seller);
      } catch {
        setOrder(null);
      }
      setLoading(false);
    };
    load();
  }, [orderId]);

  if (loading) return <p className="text-muted">লোড হচ্ছে...</p>;
  if (!order) return <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-6 py-14 text-center">
      <p className="text-lg font-bold">অর্ডারটি পাওয়া যায়নি</p>
      <div className="mt-4"><Button href="/orders" variant="outline">আমার অর্ডার</Button></div>
    </div>;

  const product = Array.isArray(order.products)
    ? order.products[0]
    : order.products;
  const mainImage =
    product?.product_images?.find((i: any) => i.is_main)?.image_url ??
    product?.product_images?.[0]?.image_url;

  return (
    <div>
      <PageHeader
        title="অর্ডারের বিবরণ"
        action={
          <Button href="/orders" variant="outline" size="sm">
            ফিরে যান
          </Button>
        }
      />
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex gap-4">
            {mainImage && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                <Image src={mainImage} alt="" fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div>
              <p className="font-semibold">
                {order.order_items?.[0]?.product_name_snapshot}
              </p>
              <div className="mt-2">
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-2 text-lg font-bold">
                {formatBdt(calcOrderTotal(order.order_items))}
              </p>
              <p className="text-sm text-muted">
                {calcOrderItemCount(order.order_items).toLocaleString("bn-BD")} পিস ·{" "}
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </Card>

        {seller && (
          <Card>
            <h3 className="font-extrabold">বিক্রেতা</h3>
            <p className="mt-1">{seller.store_name}</p>
            <p className="text-sm text-muted">{seller.full_name}</p>
            {seller.phone && (
              <a href={`tel:${seller.phone}`} className="text-sm text-primary-strong">
                {seller.phone}
              </a>
            )}
          </Card>
        )}

        <Card>
          <h3 className="font-extrabold">পণ্য</h3>
          <div className="mt-3 flex flex-col gap-2">
            {order.order_items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {item.product_name_snapshot}
                  {item.product_variants?.color
                    ? ` · ${item.product_variants.color}`
                    : ""}
                  {item.product_sizes?.size
                    ? ` · ${item.product_sizes.size}`
                    : ""}{" "}
                  × {item.quantity}
                </span>
                <span>
                  {formatBdt(item.price_snapshot * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-extrabold">ডেলিভারি</h3>
          <p className="mt-2 text-sm">{order.full_name}</p>
          <p className="text-sm text-muted">{order.phone}</p>
          <p className="text-sm text-muted">
            {order.delivery_address}, {order.city}
          </p>
        </Card>

        {order.status?.toLowerCase() === "completed" && (
          <Button href={`/review/${order.id}`} size="lg">রিভিউ দিন</Button>
        )}
      </div>
    </div>
  );
}
