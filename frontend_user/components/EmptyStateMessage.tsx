export default function EmptyStateMessage() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center backdrop-blur-xl">
      <p className="text-sm text-silver">
        No items match your search/filter. Try adjusting your filters.
      </p>
    </div>
  );
}
