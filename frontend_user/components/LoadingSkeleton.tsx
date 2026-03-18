export default function LoadingSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[280px] animate-pulse rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
        />
      ))}
    </div>
  );
}
