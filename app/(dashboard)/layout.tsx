import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardShell } from "@/components/account/DashboardShell";
import { getAuthSession } from "@/lib/auth";
import { buildShellProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await getAuthSession();

  if (!user) {
    redirect("/sign-in");
  }

  const shellProfile = profile ?? buildShellProfile(user);

  return <DashboardShell profile={shellProfile}>{children}</DashboardShell>;
}
