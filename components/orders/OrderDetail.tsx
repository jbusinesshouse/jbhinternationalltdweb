"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import { supabase } from "@/lib/supabase/browser";
import { calcOrderItemCount, calcOrderTotal, formatDate } from "@/lib/utils";

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          `*, order_items (quantity, price_snapshot, product_name_snapshot, product_variants (color), product_sizes (size)), products (seller_id, product_images (image_url, is_main))`
        )
        .eq("id", orderId)
        .single();
      setOrder(data);
      const product = Array.isArray(data?.products)
        ? data.products[0]
        : data?.products;
      if (product?.seller_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, phone, store_name")
          .eq("id", product.seller_id)
          .single();
        setSeller(prof);
      }
      setLoading(false);
    };
    load();
  }, [orderId]);

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!order) return <p>Order not found</p>;

  const product = Array.isArray(order.products)
    ? order.products[0]
    : order.products;
  const mainImage =
    product?.product_images?.find((i: any) => i.is_main)?.image_url ??
    product?.product_images?.[0]?.image_url;

  return (
    <div>
      <PageHeader
        title="Order Details"
        action={
          <Button href="/orders" variant="outline" size="sm">
            Back
          </Button>
        }
      />
      <div className="space-y-4">
        <Card>
          <div className="flex gap-4">
            {mainImage && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
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
                BDT {calcOrderTotal(order.order_items).toFixed(2)}
              </p>
              <p className="text-sm text-muted">
                {calcOrderItemCount(order.order_items)} items ·{" "}
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </Card>

        {seller && (
          <Card>
            <h3 className="font-semibold">Seller</h3>
            <p className="mt-1">{seller.store_name}</p>
            <p className="text-sm text-muted">{seller.full_name}</p>
            {seller.phone && (
              <a href={`tel:${seller.phone}`} className="text-sm text-primary">
                {seller.phone}
              </a>
            )}
          </Card>
        )}

        <Card>
          <h3 className="font-semibold">Items</h3>
          <div className="mt-3 space-y-2">
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
                  BDT {(item.price_snapshot * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold">Delivery</h3>
          <p className="mt-2 text-sm">{order.full_name}</p>
          <p className="text-sm text-muted">{order.phone}</p>
          <p className="text-sm text-muted">
            {order.delivery_address}, {order.city}
          </p>
        </Card>

        {order.status?.toLowerCase() === "completed" && (
          <Button href={`/review/${order.id}`}>Leave a Review</Button>
        )}
      </div>
    </div>
  );
}
