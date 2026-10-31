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

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("bn-BD", {
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

/** 1375 → "৳১,৩৭৫" */
export function formatBdt(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("bn-BD")}`;
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
