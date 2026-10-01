"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/lib/actions/auth";
import { FieldError, FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-invalid={Boolean(state?.errors?.email)} />
        <FieldError errors={state?.errors?.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" aria-invalid={Boolean(state?.errors?.password)} />
        <FieldError errors={state?.errors?.password} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary w-full py-3" pendingLabel="Logging in…">Log in</SubmitButton>
      <p className="text-center text-sm text-muted">
        New to eBazar?{" "}
        <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-jade-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" name="name" autoComplete="name" required className="input" aria-invalid={Boolean(state?.errors?.name)} />
        <FieldError errors={state?.errors?.name} />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" aria-invalid={Boolean(state?.errors?.email)} />
        <FieldError errors={state?.errors?.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required className="input" aria-invalid={Boolean(state?.errors?.password)} />
        <p className="mt-1 text-xs text-muted">At least 8 characters, with a letter and a number.</p>
        <FieldError errors={state?.errors?.password} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary w-full py-3" pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-jade-700 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
