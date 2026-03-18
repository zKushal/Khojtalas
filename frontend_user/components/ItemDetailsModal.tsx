import type { LostFoundItem } from "./ItemCard";

type ItemDetailsModalProps = {
  item: LostFoundItem | null;
  onClose: () => void;
};

export default function ItemDetailsModal({ item, onClose }: ItemDetailsModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-onyx text-white shadow-2xl">
        <div className="relative h-64 overflow-hidden bg-obsidian">
          {item.mediaType === "video" && item.mediaUrl ? (
            <video src={item.mediaUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
          ) : item.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.mediaUrl} alt={item.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(0,242,234,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(255,0,80,0.2),transparent_40%)] text-xs text-white/75">
              No media available
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl border border-white/10 bg-black/35 px-3 py-1.5 text-xs text-white/85 backdrop-blur-sm transition hover:bg-black/50"
          >
            Close
          </button>
        </div>

        <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs">
              <span className={item.status === "LOST" ? "text-magenta" : "text-cyan"}>{item.status}</span>
              <span className="text-silver/70">•</span>
              <span className={item.verificationStatus === "verified" ? "text-cyan" : "text-silver/70"}>
                {item.verificationStatus === "verified" ? "✔ Verified" : "⏳ Under Review"}
              </span>
            </div>
            <h3 className="text-lg font-bold">{item.title}</h3>
          </div>
        </div>

        <p className="text-sm text-white/85">{item.description}</p>

        <div className="mt-4 space-y-1 text-sm text-silver">
          <p>📍 {item.location}</p>
          <p>🕐 {item.timeAgo}</p>
          <p>👤 @{item.reportedBy}</p>
        </div>

        {item.authenticityDetail ? (
          <div className="mt-4 rounded-xl border border-cyan/25 bg-cyan/10 px-3 py-2 text-xs text-cyan">
            🔒 {item.authenticityDetail}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/70">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Helpful {item.helpfulCount}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Details {item.detailsCount}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Shares {item.shareCount}</span>
        </div>
        </div>
      </div>
    </div>
  );
}
