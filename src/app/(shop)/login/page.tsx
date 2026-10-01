import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { callbackUrl } = await props.searchParams;
  const target = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/";
  if (await getCurrentUser()) redirect(target);

  return (
    <AuthShell title="Welcome back" subtitle="Log in to check out, track orders or manage your store.">
      <LoginForm callbackUrl={target} />
    </AuthShell>
  );
}
