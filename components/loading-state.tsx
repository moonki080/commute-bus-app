export function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="soft-panel animate-pulse border border-white/20 bg-white/15 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-14 rounded-full bg-white/25" />
              <div className="h-12 w-28 rounded-2xl bg-white/25" />
            </div>
            <div className="space-y-3 text-right">
              <div className="h-5 w-16 rounded-full bg-white/25" />
              <div className="ml-auto h-10 w-20 rounded-2xl bg-white/25" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <div className="h-7 w-24 rounded-full bg-white/25" />
            <div className="h-7 w-24 rounded-full bg-white/25" />
          </div>
        </div>
      ))}
    </div>
  );
}
