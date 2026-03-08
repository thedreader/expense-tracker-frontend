import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { getCurrentUser } from "@/lib/user.api";

export default async function ProtectedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let user;
  try {
    user = await getCurrentUser(cookieHeader);
  } catch {
    redirect("/auth");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
