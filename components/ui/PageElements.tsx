import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-muted">{description}</p>
        )}
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
    <div
      className={`rounded-xl border border-border bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
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
    <div className="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted">{description}</p>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "text-green-700 bg-green-100",
    pending: "text-amber-700 bg-amber-100",
    processing: "text-blue-700 bg-blue-100",
    shipped: "text-indigo-700 bg-indigo-100",
    cancelled: "text-red-700 bg-red-100",
    hold: "text-orange-700 bg-orange-100",
    approved: "text-green-700 bg-green-100",
    rejected: "text-red-700 bg-red-100",
  };
  const cls =
    colors[status?.toLowerCase()] ?? "text-gray-700 bg-gray-100";

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${cls}`}
    >
      {status}
    </span>
  );
}
