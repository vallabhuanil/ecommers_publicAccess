export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex justify-between items-center">
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-3/4" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="skeleton h-96 rounded-2xl" />
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-10 w-28 mt-4" />
      </div>
    </div>
  );
}
