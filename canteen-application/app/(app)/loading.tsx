export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
