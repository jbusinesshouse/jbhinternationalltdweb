import { ReactNode } from "react";
import { ORDER_STATUS_LABEL } from "@/lib/labels";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-white p-5 ${className}`}>{children}</div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-6 py-16 text-center">
      <p className="text-lg font-bold text-foreground">{title}</p>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  );
}

/** Order / request status chip (Bangla label, contrast-checked colors). */
const STATUS_STYLES: Record<string, string> = {
  completed: "bg-teal-soft text-teal",
  approved: "bg-teal-soft text-teal",
  pending: "bg-primary-soft text-moq",
  processing: "bg-navy-soft text-navy",
  shipped: "bg-[#EFEAFF] text-[#3B2A8A]",
  hold: "bg-[#FFF1D6] text-[#8A4B00]",
  cancelled: "bg-[#FEECEC] text-[#B42318]",
  rejected: "bg-[#FEECEC] text-[#B42318]",
};

const EXTRA_LABELS: Record<string, string> = {
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase();
  const cls = STATUS_STYLES[key] ?? "bg-[#F3F4F6] text-[#374151]";
  const label = ORDER_STATUS_LABEL[key] ?? EXTRA_LABELS[key] ?? status;

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-bold ${cls}`}>{label}</span>
  );
}
