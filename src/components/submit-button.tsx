"use client";

import { useFormStatus } from "react-dom";

// Submit button that disables itself and shows a spinner while its form's
// server action is running.
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  ...rest
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className} {...rest}>
      {pending && (
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
