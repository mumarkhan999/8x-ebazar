import { Bone } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <Bone className="h-8 w-48" />
      {Array.from({ length: 3 }, (_, i) => (
        <Bone key={i} className="h-36 !rounded-2xl" />
      ))}
    </div>
  );
}
