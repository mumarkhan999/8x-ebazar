import { Bone, CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading store">
      <Bone className="h-40 !rounded-none sm:h-56" />
      <div className="mx-auto max-w-7xl px-4">
        <div className="card relative -mt-14 flex items-end gap-5 p-6">
          <Bone className="h-24 w-24 !rounded-3xl" />
          <div className="flex-1 space-y-2">
            <Bone className="h-7 w-56" />
            <Bone className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="py-8">
          <CardGridSkeleton />
        </div>
      </div>
    </div>
  );
}
