import ItemCard, { type LostFoundItem } from "./ItemCard";

type ItemFeedProps = {
  items: LostFoundItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  onReportSuspicious?: (itemId: string) => void;
};

export default function ItemFeed({
  items,
  isLoading = false,
  emptyMessage = "No feeds currently",
  onReportSuspicious,
}: ItemFeedProps) {
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-obsidian px-6 text-center text-silver/70">
        Loading feeds...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-obsidian px-6 text-center">
        <p className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-silver/80 backdrop-blur-xl">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar h-screen snap-y snap-mandatory overflow-y-scroll bg-obsidian">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onReportSuspicious={() => onReportSuspicious?.(item.id)} />
      ))}
    </div>
  );
}
