import { ListingSkeleton } from "@/components/skeletons";

// Fallback for every storefront page that doesn't define its own.
export default function Loading() {
  return <ListingSkeleton />;
}
