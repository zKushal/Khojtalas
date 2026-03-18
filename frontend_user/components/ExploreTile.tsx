import type { LostFoundItem } from "./ItemCard";

type ExploreItem = LostFoundItem & {
  category: "Electronics" | "Documents" | "Pets" | "Urgent" | "Other";
  scope: "nearby" | "global";
};

type ExploreTileProps = {
  item: ExploreItem;
  featured?: boolean;
  compact?: boolean;
  onOpen: (item: ExploreItem) => void;
};

export default function ExploreTile({ item, featured = false, compact = false, onOpen }: ExploreTileProps) {
  const statusClass = item.status === "LOST" ? "bg-magenta/85 text-white" : "bg-cyan/85 text-black";
  const glowClass = item.verificationStatus === "verified" ? "shadow-[0_0_0_1px_rgba(0,242,234,0.22),0_0_28px_rgba(0,242,234,0.16)]" : "";
  const heightClass = featured ? "h-[360px]" : compact ? "h-[220px]" : "h-[250px]";

  return (
    <button
      onClick={() => onOpen(item)}
      className={`group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-onyx text-left transition duration-300 hover:-translate-y-0.5 hover:border-white/20 ${heightClass} ${glowClass}`}
    >
      <div className="absolute inset-0">
        {item.mediaType === "video" && item.mediaUrl ? (
          <video
            src={item.mediaUrl}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : item.mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,242,234,0.22),transparent_35%),radial-gradient(circle_at_bottom,rgba(255,0,80,0.28),transparent_40%)] text-xs text-white/75">
            Media unavailable
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass}`}>{item.status}</span>
            <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-semibold text-white/85 backdrop-blur-sm">
              {item.category}
            </span>
            {item.verificationStatus === "verified" ? (
              <span className="rounded-full border border-cyan/25 bg-cyan/15 px-2.5 py-1 text-[10px] font-semibold text-cyan backdrop-blur-sm">
                ✔ Verified
              </span>
            ) : null}
          </div>

          <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/70 backdrop-blur-sm">
            {item.scope}
          </span>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] text-white/70">
            <span>📍 {item.location}</span>
            <span>•</span>
            <span>{item.timeAgo}</span>
          </div>
          <h3 className={`font-bold text-white ${featured ? "text-2xl leading-tight" : compact ? "text-sm leading-snug" : "text-base leading-snug"}`}>
            {item.title}
          </h3>
          <p className={`mt-2 text-white/80 ${featured ? "line-clamp-2 text-sm" : "line-clamp-2 text-xs"}`}>
            {item.description}
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-white/70">
            <span>@{item.reportedBy}</span>
            <span>♡ {item.helpfulCount}</span>
            <span>↗ {item.shareCount}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
