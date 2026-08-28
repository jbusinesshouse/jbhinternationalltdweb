import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await getAuthSession();

  if (!user) {
    redirect("/sign-in");
  }

  if (!profile) {
    redirect("/sign-in");
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
