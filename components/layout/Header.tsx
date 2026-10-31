import { HeaderBar } from "@/components/layout/HeaderBar";
import { getAuthSession } from "@/lib/auth";
import { fetchCategories } from "@/lib/categories";

export async function Header() {
  const [{ user, profile }, categories] = await Promise.all([
    getAuthSession(),
    fetchCategories(),
  ]);
  return <HeaderBar user={user} profile={profile} categories={categories} />;
}
