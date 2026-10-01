import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <LogoMark className="h-14 w-14" />
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">This stall is empty</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist, or the listing is no longer available.
      </p>
      <Link href="/" className="btn btn-primary mt-6">Back to eBazar</Link>
    </div>
  );
}
