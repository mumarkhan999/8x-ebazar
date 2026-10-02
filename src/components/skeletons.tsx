// Placeholder shapes shown by loading.tsx files while a page's data loads.

export function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/70 ${className}`} />;
}

export function CardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <Bone className="aspect-square !rounded-none" />
          <div className="space-y-2 p-3">
            <Bone className="h-2.5 w-1/2" />
            <Bone className="h-3.5 w-full" />
            <Bone className="h-3.5 w-3/4" />
            <Bone className="mt-3 h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8" role="status" aria-label="Loading">
      <Bone className="mb-2 h-3 w-24" />
      <Bone className="mb-8 h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-4 lg:block">
          <Bone className="h-72 w-full !rounded-2xl" />
          <Bone className="h-36 w-full !rounded-2xl" />
        </div>
        <div>
          <div className="mb-4 flex justify-between">
            <Bone className="h-4 w-24" />
            <Bone className="h-7 w-80 !rounded-full" />
          </div>
          <CardGridSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ConsolePageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div>
        <Bone className="mb-2 h-3 w-24" />
        <Bone className="h-8 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-24 !rounded-2xl" />
        ))}
      </div>
      <div className="card divide-y divide-line">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Bone className="h-10 w-10" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3.5 w-1/2" />
              <Bone className="h-3 w-1/3" />
            </div>
            <Bone className="h-6 w-16 !rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
