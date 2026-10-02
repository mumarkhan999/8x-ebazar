import { Bone } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6" role="status" aria-label="Loading product">
      <Bone className="mb-4 h-3 w-48" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_300px]">
        <div className="flex gap-3">
          <div className="hidden space-y-2 sm:block">
            <Bone className="h-16 w-16 !rounded-xl" />
            <Bone className="h-16 w-16 !rounded-xl" />
            <Bone className="h-16 w-16 !rounded-xl" />
          </div>
          <Bone className="aspect-square flex-1 !rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Bone className="h-3 w-32" />
          <Bone className="h-7 w-full" />
          <Bone className="h-7 w-2/3" />
          <Bone className="h-4 w-40" />
          <Bone className="h-20 w-full !rounded-2xl" />
          <Bone className="h-3.5 w-3/4" />
          <Bone className="h-3.5 w-2/3" />
          <Bone className="h-3.5 w-1/2" />
          <div className="grid grid-cols-2 gap-2 pt-4">
            <Bone className="h-12 !rounded-full" />
            <Bone className="h-12 !rounded-full" />
          </div>
        </div>
        <div className="space-y-4">
          <Bone className="h-52 !rounded-2xl" />
          <Bone className="h-60 !rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
