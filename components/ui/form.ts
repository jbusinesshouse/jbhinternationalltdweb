/** Shared form styling so every input on the site looks the same. */
export const inputClass =
  "w-full rounded-xl border-[1.5px] border-[#D1D5DB] bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:bg-surface disabled:text-muted";

export const labelClass = "mb-1.5 block text-sm font-bold text-foreground";

export const errorBoxClass =
  "rounded-xl bg-[#FEECEC] px-4 py-3 text-sm font-semibold text-[#B42318]";

/** Translate the few Supabase Auth messages users actually hit. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
  if (m.includes("email not confirmed")) return "আগে আপনার ইমেইল কনফার্ম করুন (ইনবক্স দেখুন)।";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। সাইন ইন করুন।";
  if (m.includes("password should be at least")) return "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।";
  if (m.includes("rate limit") || m.includes("too many")) return "অনেকবার চেষ্টা করা হয়েছে। একটু পরে আবার চেষ্টা করুন।";
  if (m.includes("failed to fetch") || m.includes("network")) return "ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";
  return message;
}
