export type AccountStatus = "active" | "freeze" | "restricted";

/** Treat null/unknown as active (matches backend). */
export function normalizeAccountStatus(
  status: string | null | undefined
): AccountStatus {
  if (status === "freeze" || status === "restricted") return status;
  return "active";
}

export function canSell(status: string | null | undefined): boolean {
  return normalizeAccountStatus(status) === "active";
}

/** Any account type may buy unless frozen. Guest OTP checkout is separate. */
export function canBuy(status: string | null | undefined): boolean {
  return normalizeAccountStatus(status) !== "freeze";
}

export function canChat(status: string | null | undefined): boolean {
  return normalizeAccountStatus(status) !== "freeze";
}
