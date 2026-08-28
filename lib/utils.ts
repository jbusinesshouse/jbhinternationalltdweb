export function isProfileComplete(profile: {
  full_name?: string | null;
  phone?: string | null;
  store_name?: string | null;
  store_type?: string | null;
  address?: string | null;
  district?: string | null;
  upazila?: string | null;
} | null): boolean {
  if (!profile) return false;
  return !!(
    profile.full_name &&
    profile.phone &&
    profile.store_name &&
    profile.store_type &&
    profile.address &&
    profile.district &&
    profile.upazila
  );
}

export function getOrderStatusColor(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case "completed":
      return "text-green-600 bg-green-50";
    case "pending":
      return "text-amber-600 bg-amber-50";
    case "processing":
      return "text-blue-600 bg-blue-50";
    case "shipped":
      return "text-indigo-600 bg-indigo-50";
    case "cancelled":
      return "text-red-600 bg-red-50";
    case "hold":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function calcOrderTotal(
  items: { quantity: number; price_snapshot: number }[] = []
): number {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.price_snapshot),
    0
  );
}

export function calcOrderItemCount(
  items: { quantity: number }[] = []
): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
