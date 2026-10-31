import Link from "next/link";
import type { ComponentType } from "react";
import { Card, PageHeader, StatusBadge } from "@/components/ui/PageElements";
import {
  BagIcon,
  BoxIcon,
  ChatIcon,
  HelpIcon,
  MegaphoneIcon,
  PlusIcon,
  StarIcon,
} from "@/components/ui/icons";
import { serverApi } from "@/lib/api-server";
import { canSell } from "@/lib/accountStatus";
import type { UserProfile } from "@/lib/auth";
import { LINKS } from "@/lib/constants";
import { calcOrderItemCount, calcOrderTotal, formatBdt, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  full_name: string;
  order_items: { quantity: number; price_snapshot: number; product_name_snapshot: string }[];
};

type ProductRow = {
  id: string;
  status: string | null;
  product_images?: { image_url: string; is_main: boolean }[];
};

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Shortcut({
  href,
  title,
  body,
  tone,
  Icon,
}: {
  href: string;
  title: string;
  body: string;
  tone: string;
  Icon: ComponentType<{ size?: number }>;
}) {
  return (
    <Link href={href} className={`flex flex-col gap-2 rounded-2xl p-5 transition-opacity hover:opacity-90 ${tone}`}>
      <Icon size={22} />
      <strong className="text-[17px]">{title}</strong>
      <span className="text-sm leading-relaxed opacity-90">{body}</span>
    </Link>
  );
}

export async function HubContent({ profile }: { profile: UserProfile }) {
  const isWholesale = profile.store_type === "wholesale";
  const isSeller = isWholesale || profile.store_type === "retail";
  const sellingEnabled = canSell(profile.status);
  const name = profile.store_name || profile.full_name || "";

  const [sales, products, myOrders] = await Promise.all([
    isWholesale && sellingEnabled ? safe(() => serverApi<{ orders: OrderRow[] }>("/sales", { auth: true })) : null,
    isSeller ? safe(() => serverApi<{ products: ProductRow[] }>("/account/products", { auth: true })) : null,
    safe(() => serverApi<{ orders: OrderRow[] }>("/orders", { auth: true })),
  ]);

  const saleOrders = sales?.orders ?? [];
  const isOpen = (s: string) => !["completed", "cancelled"].includes(s?.toLowerCase());
  const newCount = saleOrders.filter((o) => o.status?.toLowerCase() === "pending").length;
  const activeCount = saleOrders.filter((o) => isOpen(o.status) && o.status?.toLowerCase() !== "pending").length;
  const revenue = saleOrders
    .filter((o) => o.status?.toLowerCase() === "completed")
    .reduce((sum, o) => sum + calcOrderTotal(o.order_items), 0);
  const listed = (products?.products ?? []).filter((p) => (p.status ?? "active") === "active").length;
  const recent = (isWholesale ? saleOrders : (myOrders?.orders ?? [])).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isSeller ? `স্বাগতম${name ? `, ${name}` : ""}` : "হাব"}
        description={isSeller ? "আজকের অর্ডার ও পণ্যের অবস্থা এক নজরে" : "অর্ডার, সাহায্য ও দরকারি লিংক এক জায়গায়"}
      />

      {isSeller && !sellingEnabled && (
        <div role="status" className="rounded-2xl bg-[#FFF1D6] px-4 py-3 text-sm font-semibold text-[#8A4B00]">
          আপনার সেলার অ্যাকাউন্ট এখনো চালু হয়নি। অ্যাডমিন অনুমোদনের পর বিক্রি ও পণ্য আপলোড করতে পারবেন।
        </div>
      )}

      {isSeller && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isWholesale ? (
            <>
              <Stat label="নতুন অর্ডার" value={newCount.toLocaleString("bn-BD")} tone="text-primary-strong" />
              <Stat label="চলমান অর্ডার" value={activeCount.toLocaleString("bn-BD")} />
              <Stat label="মোট বিক্রি (সম্পন্ন)" value={formatBdt(revenue)} />
            </>
          ) : (
            <>
              <Stat label="আমার অর্ডার" value={(myOrders?.orders.length ?? 0).toLocaleString("bn-BD")} />
              <Stat label="সক্রিয় অর্ডার" value={(myOrders?.orders ?? []).filter((o) => isOpen(o.status)).length.toLocaleString("bn-BD")} />
              <Stat label="সম্পন্ন অর্ডার" value={(myOrders?.orders ?? []).filter((o) => !isOpen(o.status) && o.status?.toLowerCase() === "completed").length.toLocaleString("bn-BD")} />
            </>
          )}
          <Stat label="লিস্টেড পণ্য" value={listed.toLocaleString("bn-BD")} />
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-lg font-extrabold">{isWholesale ? "সাম্প্রতিক অর্ডার" : "আমার সাম্প্রতিক অর্ডার"}</h2>
          <Link href={isWholesale ? "/sales" : "/orders"} className="text-sm font-bold text-primary-strong hover:underline">
            সব অর্ডার →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-muted">এখনো কোনো অর্ডার নেই।</p>
        ) : (
          <ul className="divide-y divide-[#F0F1F4]">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={isWholesale ? `/sales/${o.id}` : `/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.order_items?.[0]?.product_name_snapshot ?? "অর্ডার"}</p>
                    <p className="text-sm text-muted">
                      {isWholesale ? `${o.full_name} · ` : ""}
                      {calcOrderItemCount(o.order_items).toLocaleString("bn-BD")} পিস · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold">{formatBdt(calcOrderTotal(o.order_items))}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isSeller && sellingEnabled && (
          <Shortcut href="/product-upload" title="নতুন পণ্য আপলোড" body="ছবি, রং, সাইজ ও স্টক দিয়ে কয়েক মিনিটে লিস্ট করুন।" tone="bg-primary text-primary-ink" Icon={PlusIcon} />
        )}
        {isWholesale && (
          <>
            <Shortcut href="/advertise-product" title="পণ্যের বিজ্ঞাপন দিন" body="হোম ও ক্যাটাগরি পেজে স্পন্সরড হিসেবে দেখান।" tone="bg-navy text-white" Icon={MegaphoneIcon} />
            <Shortcut href="/featured-request" title="ফিচার্ড স্টোরের আবেদন" body="হোম পেজের ফিচার্ড স্টোর তালিকায় জায়গা পান।" tone="border border-border bg-white" Icon={StarIcon} />
          </>
        )}
        <Shortcut href="/orders" title="আমার অর্ডার" body="আপনার কেনা অর্ডার ট্র্যাক করুন।" tone="border border-border bg-white" Icon={BagIcon} />
        <Shortcut href="/messages" title="মেসেজ" body="ক্রেতা ও সেলারদের সাথে চ্যাট।" tone="border border-border bg-white" Icon={ChatIcon} />
        <Shortcut href="/support" title="সাহায্য" body="অ্যাকাউন্ট বা পণ্য নিয়ে সমস্যা হলে সাপোর্টে জানান।" tone="border border-border bg-white" Icon={HelpIcon} />
        {isWholesale && (
          <Shortcut href="/sales" title="বিক্রি ও অর্ডার" body="সব বিক্রয়ের অর্ডার ম্যানেজ করুন।" tone="border border-border bg-white" Icon={BoxIcon} />
        )}
      </div>

      <Card>
        <p className="font-extrabold">দরকারি লিংক</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <Link href="/about" className="text-primary-strong hover:underline">আমাদের সম্পর্কে</Link>
          <Link href={LINKS.termsAndConditions} className="text-primary-strong hover:underline">শর্তাবলী</Link>
          <Link href={LINKS.privacyPolicy} className="text-primary-strong hover:underline">প্রাইভেসি পলিসি</Link>
        </div>
      </Card>
    </div>
  );
}
