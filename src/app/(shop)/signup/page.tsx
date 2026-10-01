import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage(props: PageProps<"/signup">) {
  const { callbackUrl } = await props.searchParams;
  const target = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/";
  if (await getCurrentUser()) redirect(target);

  return (
    <AuthShell title="Create your account" subtitle="One account to shop every store — and to open your own.">
      <SignupForm callbackUrl={target} />
    </AuthShell>
  );
}
